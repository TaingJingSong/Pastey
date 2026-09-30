import Foundation
import SQLite3

private let SQLITE_TRANSIENT = unsafeBitCast(-1, to: sqlite3_destructor_type.self)

@objc(PasteySQLite)
class PasteySQLite: NSObject {

  private var db: OpaquePointer?
  private let queue = DispatchQueue(label: "com.pastey.sqlite")

  @objc static func requiresMainQueueSetup() -> Bool { return false }

  @objc func open(
    _ name: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    queue.async { [weak self] in
      guard let self = self else { return }

      let fm = FileManager.default
      guard let support = fm.urls(
        for: .applicationSupportDirectory,
        in: .userDomainMask
      ).first else {
        reject("path", "No Application Support directory", nil)
        return
      }

      let dir = support.appendingPathComponent("Pastey", isDirectory: true)
      try? fm.createDirectory(at: dir, withIntermediateDirectories: true)
      let path = dir.appendingPathComponent(name).path

      var handle: OpaquePointer?
      let rc = sqlite3_open_v2(
        path,
        &handle,
        SQLITE_OPEN_READWRITE | SQLITE_OPEN_CREATE | SQLITE_OPEN_FULLMUTEX,
        nil
      )

      guard rc == SQLITE_OK, let opened = handle else {
        let msg = handle.flatMap { String(cString: sqlite3_errmsg($0)) } ?? "unknown"
        reject("open", "Failed to open DB: \(msg) at \(path)", nil)
        return
      }

      self.db = opened

      sqlite3_exec(opened, "PRAGMA journal_mode=WAL;", nil, nil, nil)
      sqlite3_exec(opened, "PRAGMA foreign_keys=ON;", nil, nil, nil)

      resolve(true)
    }
  }

  @objc func execute(
    _ sql: String,
    params: [Any],
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    queue.async { [weak self] in
      guard let self = self, let db = self.db else {
        reject("closed", "Database is not open", nil)
        return
      }

      var stmt: OpaquePointer?
      guard sqlite3_prepare_v2(db, sql, -1, &stmt, nil) == SQLITE_OK else {
        let msg = String(cString: sqlite3_errmsg(db))
        reject("prepare", msg, nil)
        return
      }
      defer { sqlite3_finalize(stmt) }

      for (i, raw) in params.enumerated() {
        let idx = Int32(i + 1)
        switch raw {
        case is NSNull:
          sqlite3_bind_null(stmt, idx)
        case let n as NSNumber:
          if CFNumberIsFloatType(n) {
            sqlite3_bind_double(stmt, idx, n.doubleValue)
          } else {
            sqlite3_bind_int64(stmt, idx, n.int64Value)
          }
        case let s as String:
          s.withCString { cstr in
            sqlite3_bind_text(stmt, idx, cstr, -1, SQLITE_TRANSIENT)
          }
        default:
          let s = String(describing: raw)
          s.withCString { cstr in
            sqlite3_bind_text(stmt, idx, cstr, -1, SQLITE_TRANSIENT)
          }
        }
      }

      var rows: [[String: Any]] = []
      while true {
        let step = sqlite3_step(stmt)
        if step == SQLITE_ROW {
          rows.append(self.readRow(stmt))
        } else if step == SQLITE_DONE {
          break
        } else {
          let msg = String(cString: sqlite3_errmsg(db))
          reject("step", msg, nil)
          return
        }
      }

      // Serialize to JSON string — the one type that's rock solid in bridgeless mode
      do {
        let data = try JSONSerialization.data(withJSONObject: rows, options: [])
        let json = String(data: data, encoding: .utf8) ?? "[]"
        resolve(json)
      } catch {
        reject("json", "Failed to serialize rows: \(error.localizedDescription)", error)
      }
    }
  }

  private func readRow(_ stmt: OpaquePointer?) -> [String: Any] {
    var row: [String: Any] = [:]
    let count = sqlite3_column_count(stmt)
    for i in 0..<count {
      guard let cName = sqlite3_column_name(stmt, i) else { continue }
      let name = String(cString: cName)
      let type = sqlite3_column_type(stmt, i)
      switch type {
      case SQLITE_INTEGER:
        row[name] = Int(sqlite3_column_int64(stmt, i))
      case SQLITE_FLOAT:
        row[name] = Double(sqlite3_column_double(stmt, i))
      case SQLITE_TEXT:
        if let cstr = sqlite3_column_text(stmt, i) {
          row[name] = String(cString: cstr)
        } else {
          row[name] = NSNull()
        }
      case SQLITE_NULL:
        row[name] = NSNull()
      default:
        row[name] = NSNull()
      }
    }
    return row
  }
}

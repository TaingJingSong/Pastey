/**
 * @format
 */

import 'react-native';
import React from 'react';
import { it, expect } from '@jest/globals';
import renderer, { act } from 'react-test-renderer';
import App from '../src/App';

it('renders correctly', async () => {
  let tree: any;
  await act(async () => {
    tree = renderer.create(<App />);
    await new Promise(resolve => setTimeout(resolve, 250));
  });
  expect(tree.toJSON()).toBeTruthy();
});

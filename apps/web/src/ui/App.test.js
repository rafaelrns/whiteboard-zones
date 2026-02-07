import { jsx as _jsx } from "react/jsx-runtime";
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from './App';
describe('App', () => {
    it('renders title', () => {
        render(_jsx(App, {}));
        expect(screen.getByText('Zonas Colaborativas')).toBeTruthy();
    });
});

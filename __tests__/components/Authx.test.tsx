import React from 'react';
import { render, screen } from '@testing-library/react';
import Authx, { COUNTRIES } from '../../src/ui/Authx';

// Mock Firebase completely
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({ options: {} })),
  getApps: jest.fn(() => []),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  RecaptchaVerifier: jest.fn(),
  signInWithPhoneNumber: jest.fn(),
}));

// Mock fetch for API calls
global.fetch = jest.fn();

describe('Authx Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });
  });

  describe('Initial Render', () => {
    it('should render with default props', () => {
      render(<Authx />);
      
      expect(screen.getByText('United Kingdom (+44)')).toBeInTheDocument();
      expect(screen.getByText('+44')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your phone number')).toBeInTheDocument();
      expect(screen.getByText('Send Verification Code')).toBeInTheDocument();
    });

    it('should use custom initial country', () => {
      render(<Authx initialCountry="US" />);
      
      expect(screen.getByText('United States (+1)')).toBeInTheDocument();
      expect(screen.getByText('+1')).toBeInTheDocument();
    });

    it('should use custom countries prop', () => {
      const customCountries = {
        JP: { name: 'Japan', dial: '+81', flag: '🇯🇵', min: 10, max: 11 }
      };
      
      render(<Authx countries={customCountries} initialCountry={"JP" as any} />);
      
      expect(screen.getByText('Japan (+81)')).toBeInTheDocument();
      expect(screen.getByText('+81')).toBeInTheDocument();
    });
  });

  describe('Theme and Styling', () => {
    it('should apply custom className', () => {
      const { container } = render(<Authx className="custom-authx" />);
      
      expect(container.firstChild).toHaveClass('custom-authx');
    });

    it('should apply dark theme', () => {
      render(<Authx theme="dark" />);
      
      // Check if component renders without errors with dark theme
      expect(screen.getByPlaceholderText('Enter your phone number')).toBeInTheDocument();
    });

    it('should apply custom color scheme', () => {
      const colorScheme = {
        primary: '#ff0000',
        background: '#000000'
      };
      
      render(<Authx colorScheme={colorScheme} />);
      
      // Component should render without errors with custom colors
      expect(screen.getByPlaceholderText('Enter your phone number')).toBeInTheDocument();
    });

    it('should apply size variants', () => {
      render(<Authx size="lg" />);
      
      expect(screen.getByPlaceholderText('Enter your phone number')).toBeInTheDocument();
    });
  });

  describe('Labels and Visibility', () => {
    it('should use custom labels', () => {
      const customLabels = {
        phoneNumber: 'Enter your mobile',
        sendCode: 'Get OTP',
        placeholder: 'Mobile number'
      };
      
      render(<Authx labels={customLabels} />);
      
      expect(screen.getByText('Enter your mobile')).toBeInTheDocument();
      expect(screen.getByText('Get OTP')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Mobile number')).toBeInTheDocument();
    });

    it('should hide labels when showLabels is false', () => {
      const visibility = {
        showLabels: false,
        showFlags: true,
        showDialCode: true
      };
      
      render(<Authx visibility={visibility} />);
      
      // Phone Number label should be hidden
      expect(screen.queryByText('Phone Number')).not.toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('should render phone input field', () => {
      render(<Authx />);
      
      const phoneInput = screen.getByPlaceholderText('Enter your phone number');
      expect(phoneInput).toBeInTheDocument();
      expect(phoneInput).toHaveAttribute('type', 'tel');
    });

    it('should render country selector', () => {
      render(<Authx />);
      
      const countrySelect = screen.getByLabelText('Country');
      expect(countrySelect).toBeInTheDocument();
      expect(countrySelect.tagName).toBe('SELECT');
    });

    it('should render send button in disabled state initially', () => {
      render(<Authx />);
      
      const sendButton = screen.getByText('Send Verification Code');
      expect(sendButton).toBeInTheDocument();
      expect(sendButton).toBeDisabled();
    });

    it('should render recaptcha container', () => {
      render(<Authx />);
      
      const recaptchaContainer = document.getElementById('authx-recaptcha');
      expect(recaptchaContainer).toBeInTheDocument();
    });
  });

  describe('COUNTRIES constant', () => {
    it('should export COUNTRIES with correct structure', () => {
      expect(COUNTRIES).toBeDefined();
      expect(COUNTRIES.GB).toEqual({
        name: 'United Kingdom',
        dial: '+44',
        flag: '🇬🇧',
        min: 10,
        max: 10
      });
      expect(COUNTRIES.US).toEqual({
        name: 'United States',
        dial: '+1',
        flag: '🇺🇸',
        min: 10,
        max: 10
      });
    });

    it('should have consistent structure for all countries', () => {
      Object.entries(COUNTRIES).forEach(([code, country]) => {
        expect(country).toHaveProperty('name');
        expect(country).toHaveProperty('dial');
        expect(country).toHaveProperty('flag');
        expect(country).toHaveProperty('min');
        expect(country).toHaveProperty('max');
        expect(typeof country.name).toBe('string');
        expect(typeof country.dial).toBe('string');
        expect(typeof country.flag).toBe('string');
        expect(typeof country.min).toBe('number');
        expect(typeof country.max).toBe('number');
      });
    });
  });

  describe('Props Interface', () => {
    it('should accept verifyEndpoint prop', () => {
      render(<Authx verifyEndpoint="/api/custom-verify" />);
      
      // Component should render without errors
      expect(screen.getByPlaceholderText('Enter your phone number')).toBeInTheDocument();
    });

    it('should accept firebaseConfig prop', () => {
      const firebaseConfig = {
        apiKey: 'test-key',
        authDomain: 'test.firebaseapp.com',
        projectId: 'test-project'
      };
      
      render(<Authx firebaseConfig={firebaseConfig} />);
      
      // Component should render without errors
      expect(screen.getByPlaceholderText('Enter your phone number')).toBeInTheDocument();
    });
  });
});
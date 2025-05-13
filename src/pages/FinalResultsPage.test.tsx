import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import FinalResultsPage from './FinalResultsPage';
import { GameContext } from '@/contexts/GameContext';

// Mock the router hooks
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useParams: () => ({ roomId: 'test-room' }),
}));

describe('FinalResultsPage', () => {
  const mockImages = [
    {
      id: 'img1',
      url: 'https://example.com/image1.jpg',
      title: 'Test Image 1',
      year: 1950,
      location_name: 'Test Location 1',
      location_lat: 0,
      location_lng: 0,
      source: 'Test Source',
      source_url: 'https://example.com'
    }
  ];

  const mockRoundResults = [
    {
      imageId: 'img1',
      distanceKm: 100,
      guessYear: 1960,
      score: 75,
      timestamp: new Date().toISOString()
    }
  ];

  const mockGameContextValue = {
    roomId: 'test-room',
    images: mockImages,
    roundResults: mockRoundResults,
    isLoading: false,
    error: null,
    hintsAllowed: 3,
    roundTimerSec: 60,
    totalGameAccuracy: 65.5, // Decimal to test rounding
    totalGameXP: 75.2, // Decimal to test rounding
    globalAccuracy: 80.7,
    globalXP: 5000.4,
    setHintsAllowed: jest.fn(),
    setRoundTimerSec: jest.fn(),
    startGame: jest.fn(),
    recordRoundResult: jest.fn(),
    resetGame: jest.fn(),
    fetchGlobalMetrics: jest.fn()
  };

  it('renders correctly with proper pill format', () => {
    render(
      <GameContext.Provider value={mockGameContextValue}>
        <MemoryRouter>
          <FinalResultsPage />
        </MemoryRouter>
      </GameContext.Provider>
    );

    // Test heading
    expect(screen.getByText('Final Score')).toBeInTheDocument();

    // Test accuracy pill
    const accuracyLabel = screen.getByText('Accuracy:');
    expect(accuracyLabel).toBeInTheDocument();
    
    // Should display rounded percentage (66% from 65.5)
    const accuracyPills = screen.getAllByText('66%');
    expect(accuracyPills.length).toBeGreaterThan(0);
    
    // Test XP pill
    const xpLabel = screen.getByText('XP:');
    expect(xpLabel).toBeInTheDocument();
    
    // Should display rounded XP (75 from 75.2)  
    const xpPills = screen.getAllByText('75');
    expect(xpPills.length).toBeGreaterThan(0);
    
    // Verify no "Avg Acc" or "XP" text inside pills
    expect(screen.queryByText(/Avg Acc/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\d+ XP/)).not.toBeInTheDocument();
  });
}); 
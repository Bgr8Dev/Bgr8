import { useEffect, useState } from 'react';
import { FaCalendarAlt, FaMapMarkerAlt, FaUsers, FaTrophy, FaFootballBall, FaTableTennis, FaGamepad, FaSpinner, FaChevronDown, FaChevronUp, FaTrash } from 'react-icons/fa';
import { Tournament, getTournamentsBySport, getAllTournaments, deleteTournament } from '../../services/tournamentService';
import '../../styles/tournamentStyles/TournamentList.css';
import React from 'react';
// Import react-tournament-brackets components
import { SingleEliminationBracket, Match, SVGViewer, MatchData, ParticipantData, DoubleEliminationBracket } from 'react-tournament-brackets';

// Extend the ParticipantData interface to include the teamInfo property
interface ExtendedParticipantData extends ParticipantData {
  teamInfo?: {
    name: string;
    players: number;
  } | null;
}

interface TournamentListProps {
  sportType?: 'football' | 'badminton' | 'esports';
  limit?: number;
}

export default function TournamentList({ sportType, limit }: TournamentListProps) {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedTournamentId, setExpandedTournamentId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<MatchData | null>(null);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  
  useEffect(() => {
    const fetchTournaments = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let fetchedTournaments: Tournament[];
        
        if (sportType) {
          fetchedTournaments = await getTournamentsBySport(sportType);
        } else {
          fetchedTournaments = await getAllTournaments();
        }
        
        // Sort tournaments by start date, most recent first
        fetchedTournaments.sort((a, b) => {
          return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
        });
        
        // Apply limit if provided
        if (limit && fetchedTournaments.length > limit) {
          fetchedTournaments = fetchedTournaments.slice(0, limit);
        }
        
        setTournaments(fetchedTournaments);
      } catch (err) {
        console.error('Error fetching tournaments:', err);
        setError('Failed to load tournaments. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTournaments();
  }, [sportType, limit]);

  const getSportIcon = (type: string) => {
    switch (type) {
      case 'football':
        return <FaFootballBall className="sport-icon football" />;
      case 'badminton':
        return <FaTableTennis className="sport-icon badminton" />;
      case 'esports':
        return <FaGamepad className="sport-icon esports" />;
      default:
        return <FaTrophy className="sport-icon" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const toggleExpand = (tournamentId: string | undefined) => {
    if (!tournamentId) return;
    
    if (expandedTournamentId === tournamentId) {
      setExpandedTournamentId(null);
    } else {
      setExpandedTournamentId(tournamentId);
    }
  };

  // New method to convert tournament data to the format expected by react-tournament-brackets
  const createBracketData = (tournament: Tournament): MatchData[] => {
    // Use actual number of teams first
    const actualTeamCount = tournament.teams.length;
    
    // Calculate the smallest power of 2 that fits all teams
    const numTeams = Math.pow(2, Math.ceil(Math.log2(Math.max(actualTeamCount, 2))));
    const rounds = Math.log2(numTeams);
    const matches: MatchData[] = [];
    
    // Start with the final match
    matches.push({
      id: 1,
      name: 'Final',
      nextMatchId: null,
      tournamentRoundText: 'Final',
      startTime: tournament.startDate,
      state: 'SCHEDULED',
      participants: [
        { id: 'finalist-1', name: 'TBD', teamInfo: null } as ExtendedParticipantData,
        { id: 'finalist-2', name: 'TBD', teamInfo: null } as ExtendedParticipantData
      ]
    });
    
    // Create a mapping of match positions to IDs
    const matchPositions: {[key: string]: number} = {};
    
    // Final match is at position (1, 1)
    matchPositions['1-1'] = 1;
    
    // Create the bracket structure
    for (let round = 2; round <= rounds; round++) {
      const roundName = getRoundName(rounds - round + 1, rounds);
      const matchesInRound = Math.pow(2, round - 1);
      
      for (let matchInRound = 1; matchInRound <= matchesInRound; matchInRound++) {
        // Calculate parent match info
        const parentRound = round - 1;
        const parentMatchInRound = Math.ceil(matchInRound / 2);
        const parentPosition = `${parentRound}-${parentMatchInRound}`;
        
        // If parent match exists, get its ID
        const parentMatchId = matchPositions[parentPosition];
        
        // Current match position
        const position = `${round}-${matchInRound}`;
        
        // Create match with dynamic ID
        const matchId = matches.length + 1;
        matchPositions[position] = matchId;
        
        matches.push({
          id: matchId,
          name: `${roundName} ${Math.ceil(matchInRound/2)}`,
          nextMatchId: parentMatchId,
          tournamentRoundText: roundName,
          startTime: tournament.startDate,
          state: 'SCHEDULED',
          participants: [
            { id: `seed-${matchId}-1`, name: 'TBD', teamInfo: null } as ExtendedParticipantData,
            { id: `seed-${matchId}-2`, name: 'TBD', teamInfo: null } as ExtendedParticipantData
          ]
        });
      }
    }
    
    // Sort matches by ID to ensure proper ordering
    matches.sort((a, b) => a.id - b.id);
    
    // Find first round matches (those without any child matches pointing to them)
    const firstRoundMatches = matches.filter(m => !matches.some(child => child.nextMatchId === m.id));
    
    // Sort first round matches to maintain bracket order
    firstRoundMatches.sort((a, b) => a.id - b.id);
    
    // Prepare teams array with proper padding if needed
    const teamsArray = [...tournament.teams];
    while (teamsArray.length < firstRoundMatches.length * 2) {
      teamsArray.push({ name: 'TBD', players: 0 });
    }
    
    // Distribute teams according to standard tournament seeding
    for (let i = 0; i < firstRoundMatches.length; i++) {
      const matchIndex = matches.findIndex(m => m.id === firstRoundMatches[i].id);
      
      // Calculate seeded positions for this match
      // For perfect brackets, this creates matchups like 1 vs 16, 2 vs 15, etc.
      const team1Idx = i;
      const team2Idx = firstRoundMatches.length * 2 - 1 - i;
      
      if (matchIndex !== -1) {
        // Team 1 assignment
        if (team1Idx < teamsArray.length && teamsArray[team1Idx]) {
          matches[matchIndex].participants[0] = { 
            id: `team-${team1Idx}`, 
            name: teamsArray[team1Idx].name,
            // Store complete team info for later reference
            teamInfo: teamsArray[team1Idx]
          } as ExtendedParticipantData;
        }
        
        // Team 2 assignment
        if (team2Idx < teamsArray.length && teamsArray[team2Idx]) {
          matches[matchIndex].participants[1] = { 
            id: `team-${team2Idx}`, 
            name: teamsArray[team2Idx].name,
            // Store complete team info for later reference
            teamInfo: teamsArray[team2Idx]
          } as ExtendedParticipantData;
        }
        
        // Log team assignment for debugging
        console.log(`Match ${matches[matchIndex].id} (${matches[matchIndex].name}): ${matches[matchIndex].participants[0].name} vs ${matches[matchIndex].participants[1].name}`);
      }
    }
    
    // Handle byes for teams that get a free pass to the next round
    // Advance teams that don't have opponents to the next round
    if (actualTeamCount < numTeams) {
      propagateByeMatches(matches);
    }
    
    return matches;
  };
  
  // Helper function to handle byes in the tournament
  const propagateByeMatches = (matches: MatchData[]) => {
    // Find first round matches with TBD participants
    const firstRoundMatches = matches.filter(m => {
      // First round matches are typically the highest ID matches
      return (m.participants.some(p => p.name === 'TBD' || !p.name) || 
             m.participants.some(p => p.name && p.name.includes('TBD'))) && 
             !matches.some(child => child.nextMatchId === m.id);
    });
    
    console.log('Propagating byes for', firstRoundMatches.length, 'first round matches');
    
    // For each first round match that has a bye (one real team vs TBD)
    firstRoundMatches.forEach(match => {
      // Find participant with TBD name
      const byeIndex = match.participants.findIndex(p => 
        p.name === 'TBD' || !p.name || (p.name && p.name.includes('TBD'))
      );
      
      // If only one participant is TBD (the other is a real team), it's a bye
      if (byeIndex !== -1 && match.nextMatchId) {
        const advancingIndex = byeIndex === 0 ? 1 : 0;
        const advancingTeam = match.participants[advancingIndex];
        
        console.log(`Match ${match.id} has a bye: ${advancingTeam.name} advances automatically`);
        
        // Find the next match
        const nextMatchIndex = matches.findIndex(m => m.id === match.nextMatchId);
        if (nextMatchIndex !== -1) {
          // Determine which participant slot to fill in the next match
          // If this match is an odd-numbered match feeding into the next match, use first slot
          // Otherwise use second slot
          const childMatches = matches.filter(m => m.nextMatchId === match.nextMatchId);
          const childIndex = childMatches.findIndex(m => m.id === match.id);
          const nextMatchSlot = childIndex % 2;
          
          // Advance the team to the next round
          matches[nextMatchIndex].participants[nextMatchSlot] = {
            id: advancingTeam.id,
            name: `${advancingTeam.name} (Bye)`,
            teamInfo: advancingTeam.teamInfo, // Preserve original team info
            resultText: 'Advanced (Bye)'
          } as ExtendedParticipantData;
          
          console.log(`Team ${advancingTeam.name} advanced to match ${matches[nextMatchIndex].id} (${matches[nextMatchIndex].name})`);
        }
      }
    });
  };

  // Create matches data for double elimination bracket
  const createDoubleEliminationData = (tournament: Tournament): MatchData[] => {
    // Calculate number of teams rounded up to nearest power of 2
    const numTeams = Math.pow(2, Math.ceil(Math.log2(tournament.maxTeams)));
    const rounds = Math.log2(numTeams);
    const matches: MatchData[] = [];
    
    // Start with the grand final
    const grandFinalId = 1;
    matches.push({
      id: grandFinalId,
      name: 'Grand Final',
      nextMatchId: null,
      tournamentRoundText: 'Grand Final',
      startTime: tournament.startDate,
      state: 'SCHEDULED',
      participants: [
        { id: 'w-finalist', name: 'Winners Bracket Champion' },
        { id: 'l-finalist', name: 'Losers Bracket Champion' }
      ]
    });
    
    // ===== WINNERS BRACKET =====
    let matchId = 2;
    
    // Winners Final (feeds into Grand Final)
    const winnersFinalId = matchId++;
    matches.push({
      id: winnersFinalId,
      name: 'Winners Final',
      nextMatchId: grandFinalId,
      tournamentRoundText: 'Winners Final',
      startTime: tournament.startDate,
      state: 'SCHEDULED',
      participants: [
        { id: 'wf-1', name: 'TBD' },
        { id: 'wf-2', name: 'TBD' }
      ]
    });
    
    // Create winners bracket (similar structure to single elimination)
    const winnersMatchStartId = matchId;
    let winnersMatchOffset = 0;
    
    // Create all winners bracket rounds except the final
    for (let round = 1; round < rounds - 1; round++) {
      const roundName = `Winners ${getRoundName(rounds - round - 1, rounds - 1)}`;
      const matchesInRound = Math.pow(2, round);
      
      for (let i = 0; i < matchesInRound; i++) {
        // For the winners semi-finals, point to winners final
        const nextMatchId = round === 1 
          ? winnersFinalId 
          : winnersMatchStartId + Math.floor(i / 2) + winnersMatchOffset - matchesInRound / 2;
          
        matches.push({
          id: matchId,
          name: `${roundName} ${Math.floor(i/2) + 1}`,
          nextMatchId,
          tournamentRoundText: roundName,
          startTime: tournament.startDate,
          state: 'SCHEDULED',
          participants: [
            { id: `w-tbd-${matchId}-1`, name: 'TBD' },
            { id: `w-tbd-${matchId}-2`, name: 'TBD' }
          ]
        });
        matchId++;
      }
      
      winnersMatchOffset += matchesInRound;
    }
    
    // ===== LOSERS BRACKET =====
    // Losers Final (feeds into Grand Final)
    const losersFinalId = matchId++;
    matches.push({
      id: losersFinalId,
      name: 'Losers Final',
      nextMatchId: grandFinalId,
      tournamentRoundText: 'Losers Final',
      startTime: tournament.startDate,
      state: 'SCHEDULED',
      participants: [
        { id: 'lf-1', name: 'TBD' },
        { id: 'lf-2', name: 'TBD' }
      ]
    });
    
    // Simplified losers bracket structure with fewer rounds for clarity
    const loserRounds = rounds > 3 ? 3 : rounds - 1;
    
    for (let i = 0; i < loserRounds; i++) {
      const matchesInRound = Math.pow(2, i);
      const roundName = `Losers Round ${i + 1}`;
      
      for (let j = 0; j < matchesInRound; j++) {
        // Connect to next loser round or to losers final for the last round
        const isLastRound = i === loserRounds - 1;
        const nextMatchId = isLastRound
          ? losersFinalId
          : matchId + matchesInRound + Math.floor(j / 2);
          
        matches.push({
          id: matchId,
          name: `${roundName} Match ${j + 1}`,
          nextMatchId,
          tournamentRoundText: roundName,
          startTime: tournament.startDate,
          state: 'SCHEDULED',
          participants: [
            { id: `l-tbd-${matchId}-1`, name: isLastRound ? `LR${i} Winner ${j*2+1}` : 'TBD' },
            { id: `l-tbd-${matchId}-2`, name: isLastRound ? `LR${i} Winner ${j*2+2}` : 'TBD' }
          ]
        });
        matchId++;
      }
    }
    
    // Find first round winner's bracket matches to assign teams
    const winnersFirstRoundIds = matches
      .filter(m => m.tournamentRoundText.includes(`Winners ${getRoundName(0, rounds - 1)}`))
      .map(m => m.id)
      .sort((a, b) => a - b);
      
    // Sort teams to ensure proper seeding
    const availableTeams = [...tournament.teams];
    while (availableTeams.length < numTeams) {
      availableTeams.push({ name: 'TBD', players: 0 });
    }
    
    // Assign teams to first round matches in winners bracket using proper seeding
    for (let i = 0; i < winnersFirstRoundIds.length; i++) {
      const matchIndex = matches.findIndex(m => m.id === winnersFirstRoundIds[i]);
      if (matchIndex !== -1) {
        // Apply standard tournament seeding (1 vs 16, 8 vs 9, etc.)
        const team1Idx = i;
        const team2Idx = numTeams - 1 - i;
        
        matches[matchIndex].participants[0].name = team1Idx < availableTeams.length ? availableTeams[team1Idx].name : 'TBD';
        matches[matchIndex].participants[0].id = `team-${team1Idx}`;
        
        matches[matchIndex].participants[1].name = team2Idx < availableTeams.length ? availableTeams[team2Idx].name : 'TBD';
        matches[matchIndex].participants[1].id = `team-${team2Idx}`;
      }
    }
    
    return matches;
  };

  // Handle delete tournament
  const handleDeleteClick = (e: React.MouseEvent, tournamentId: string) => {
    e.stopPropagation(); // Prevent toggling expand when clicking delete
    setDeletingId(tournamentId);
    setDeleteConfirmation(tournamentId);
  };

  const confirmDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent toggling expand when confirming
    
    if (!deletingId) return;
    
    try {
      await deleteTournament(deletingId);
      
      // Remove from local state
      setTournaments(prev => prev.filter(t => t.id !== deletingId));
      
      // If this was the expanded tournament, collapse it
      if (expandedTournamentId === deletingId) {
        setExpandedTournamentId(null);
      }
      
      // Reset delete state
      setDeletingId(null);
      setDeleteConfirmation(null);
    } catch (err) {
      console.error('Error deleting tournament:', err);
      setError('Failed to delete tournament. Please try again.');
      setTimeout(() => setError(null), 3000);
    }
  };

  const cancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent toggling expand when canceling
    setDeletingId(null);
    setDeleteConfirmation(null);
  };

  // Modified to render only the react-tournament-brackets implementation
  const renderTournamentBracket = (tournament: Tournament) => {
    switch (tournament.tournamentFormat) {
      case 'knockout': {
        return renderReactKnockoutBracket(tournament);
      }
      case 'league':
        return renderLeagueBracket(tournament);
      case 'group':
        return renderGroupBracket(tournament);
      default:
        return (
          <div className="tournament-bracket-placeholder">
            <p>Tournament bracket visualization not available for this format.</p>
          </div>
        );
    }
  };

  // Update SVGViewer for better scrollability
  const renderReactKnockoutBracket = (tournament: Tournament) => {
    // Determine if tournament is double elimination based on tournament data
    const isDoubleElimination = tournament.eliminationType === 'double';
    
    // Choose matches based on tournament format
    const matches = isDoubleElimination 
      ? createDoubleEliminationData(tournament)
      : createBracketData(tournament);
    
    const handleMatchClick = (match: MatchData) => {
      console.log('Match clicked:', match);
      // Add more detailed logs to debug match object
      console.log('Match ID:', match.id);
      console.log('Match name:', match.name);
      console.log('Match start time:', match.startTime);
      
      // Log detailed participant information to diagnose the issue
      if (match.participants && match.participants.length > 0) {
        console.log('Match has', match.participants.length, 'participants:');
        match.participants.forEach((p, index) => {
          console.log(`Participant ${index + 1}:`, JSON.stringify(p));
        });
      } else {
        console.log('Match has no participants or empty array');
      }
      
      // Process participants to ensure they have the correct information
      const enhancedParticipants = match.participants && match.participants.length > 0 
        ? match.participants.map(p => {
            // If we have teamInfo, use it directly
            if (p.teamInfo) {
              return {
                ...p,
                name: p.teamInfo.name || p.name || 'Unknown Team'
              };
            }
            // Otherwise, use the name as is
            return {
              ...p,
              name: p.name || 'Unknown Team'
            };
          })
        : [
            { id: 'team-1', name: 'TBD' },
            { id: 'team-2', name: 'TBD' }
          ];
      
      // Ensure the match has all required properties before opening the modal
      const enhancedMatch: MatchData = {
        ...match,
        // Ensure these fields exist with default values if they're missing
        id: match.id || Math.floor(Math.random() * 1000), 
        name: match.name || 'Match',
        tournamentRoundText: match.tournamentRoundText || 'Round',
        startTime: match.startTime || new Date().toISOString(),
        state: match.state || 'SCHEDULED',
        participants: enhancedParticipants
      };
      
      // Open modal with enhanced match details
      setSelectedMatch(enhancedMatch);
      setShowMatchModal(true);
      console.log('Modal state after click:', { showMatchModal: true, selectedMatch: enhancedMatch });
    };
    
    const handleParticipantClick = (participant: ParticipantData, match: MatchData) => {
      console.log('Team clicked:', participant, 'in match:', match);
      
      // Log detailed participant information
      if (match.participants && match.participants.length > 0) {
        console.log('Match has', match.participants.length, 'participants:');
        match.participants.forEach((p, index) => {
          console.log(`Participant ${index + 1}:`, JSON.stringify(p));
        });
      }
      
      // Process participants to ensure they have the correct information
      const enhancedParticipants = match.participants && match.participants.length > 0 
        ? match.participants.map(p => {
            // If we have teamInfo, use it directly
            if (p.teamInfo) {
              return {
                ...p,
                name: p.teamInfo.name || p.name || 'Unknown Team'
              };
            }
            // Otherwise, use the name as is
            return {
              ...p,
              name: p.name || 'Unknown Team'
            };
          })
        : [
            { id: 'team-1', name: 'TBD' },
            { id: 'team-2', name: 'TBD' }
          ];
      
      // Enhance the match data similar to handleMatchClick
      const enhancedMatch: MatchData = {
        ...match,
        id: match.id || Math.floor(Math.random() * 1000),
        name: match.name || 'Match',
        tournamentRoundText: match.tournamentRoundText || 'Round',
        startTime: match.startTime || new Date().toISOString(),
        state: match.state || 'SCHEDULED',
        participants: enhancedParticipants,
        // Add the highlighted participant ID
        highlightedParticipantId: participant.id
      };
      
      // Open modal with match details, highlighting the selected participant
      setSelectedMatch(enhancedMatch);
      setShowMatchModal(true);
      console.log('Modal state after participant click:', { showMatchModal: true, selectedMatch: enhancedMatch });
    };

    // Calculate proper dimensions based on tournament size
    const numTeams = Math.pow(2, Math.ceil(Math.log2(tournament.maxTeams)));
    const numRounds = Math.log2(numTeams);
    const bracketWidth = Math.max(1200, numRounds * 180); // At least 180px per round
    const bracketHeight = Math.max(600, numTeams * 50); // At least 50px per team for spacing

    const bracketProps = {
      matches: matches,
      matchComponent: Match,
      svgWrapper: ({ children, ...props }: { children: React.ReactNode }) => (
        <SVGViewer 
          width={bracketWidth} 
          height={bracketHeight} 
          background="transparent"
          SVGBackground="transparent"
          className="scrollable-bracket"
          {...props}
        >
          {children}
        </SVGViewer>
      ),
      onMatchClick: handleMatchClick,
      onPartyClick: handleParticipantClick,
      options: {
        style: {
          roundHeader: {
            fontSize: '1rem',
            fontWeight: 600,
            fill: '#ff80ff', // Make header text more visible
            textAnchor: 'middle', // Center align text
          },
          connectorColor: '#555',
          connectorColorHighlight: '#9c27b0',
          teamNameFontSize: '0.9rem',
          teamNameFill: '#fff', // Brighter text for better visibility
          matchComponentBackground: '#333',
          matchComponentBorder: '#444',
          matchComponentColorHighlight: '#9c27b0',
          hoveredMatchBorderColor: '#ff00ff', // Very visible color when hovering
          hoveredMatchBackground: '#444', // Darker background on hover
          hoveredParticipantBorderColor: '#ff00ff', // Match the hover highlight
          hoveredParticipantBackground: '#444', // Darker background for hovered team
        },
        disableCanvasMouseOver: false, // Enable mouseover effects
        horizontalOffset: 180, // Increase spacing between rounds
        verticalOffset: numTeams <= 8 ? 80 : 60, // Adjust spacing based on bracket size
        displayEntryAnimations: false, // Disable animations for immediate display
        boxHeight: 60, // Fixed height for match boxes
        canvasPadding: 30, // Extra padding around the whole bracket
        roundSeparatorWidth: 1, // Width of lines separating rounds
      }
    };
    
    // Add custom controls for testing
    return (
      <div className="tournament-bracket knockout-bracket">
        <h4>{isDoubleElimination ? 'Double Elimination' : 'Single Elimination'} Tournament Bracket</h4>
        <div className="bracket-test-controls">
          <button 
            className="test-modal-btn" 
            onClick={(e) => {
              e.stopPropagation();
              setShowTestModal(true);
              console.log('Simple test modal triggered');
            }}
            style={{ marginRight: '10px' }}
          >
            Test Modal
          </button>
          <button 
            className="test-modal-btn" 
            onClick={(e) => {
              e.stopPropagation();
              openTestMatchModal();
            }}
          >
            Test Match Modal
          </button>
        </div>
        <div className="scrollable-bracket-container">
          {isDoubleElimination ? (
            <DoubleEliminationBracket
              {...bracketProps}
            />
          ) : (
            <SingleEliminationBracket
              {...bracketProps}
            />
          )}
        </div>
      </div>
    );
  };

  const getRoundName = (roundIndex: number, totalRounds: number) => {
    if (roundIndex === totalRounds - 1) return 'Final';
    if (roundIndex === totalRounds - 2) return 'Semi-Finals';
    if (roundIndex === totalRounds - 3) return 'Quarter-Finals';
    if (roundIndex === totalRounds - 4) return 'Round of 16';
    if (roundIndex === totalRounds - 5) return 'Round of 32';
    return `Round ${roundIndex + 1}`;
  };

  const renderLeagueBracket = (tournament: Tournament) => {
    return (
      <div className="tournament-bracket league-bracket">
        <h4>League Standings</h4>
        <div className="league-table">
          <div className="league-table-header">
            <div className="league-table-cell">Pos</div>
            <div className="league-table-cell team-name">Team</div>
            <div className="league-table-cell">P</div>
            <div className="league-table-cell">W</div>
            <div className="league-table-cell">D</div>
            <div className="league-table-cell">L</div>
            <div className="league-table-cell">Pts</div>
          </div>
          {tournament.teams.map((team, index) => (
            <div key={index} className="league-table-row">
              <div className="league-table-cell">{index + 1}</div>
              <div className="league-table-cell team-name">{team.name}</div>
              <div className="league-table-cell">0</div>
              <div className="league-table-cell">0</div>
              <div className="league-table-cell">0</div>
              <div className="league-table-cell">0</div>
              <div className="league-table-cell">0</div>
            </div>
          ))}
          {tournament.teams.length < tournament.maxTeams && (
            Array.from({ length: tournament.maxTeams - tournament.teams.length }).map((_, i) => (
              <div key={`empty-${i}`} className="league-table-row">
                <div className="league-table-cell">{tournament.teams.length + i + 1}</div>
                <div className="league-table-cell team-name">TBD</div>
                <div className="league-table-cell">-</div>
                <div className="league-table-cell">-</div>
                <div className="league-table-cell">-</div>
                <div className="league-table-cell">-</div>
                <div className="league-table-cell">-</div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderGroupBracket = (tournament: Tournament) => {
    // Calculate the number of groups (for simplicity, we'll assume 4 groups in a 16-team tournament)
    const groupCount = tournament.maxTeams === 32 ? 8 : tournament.maxTeams === 16 ? 4 : 2;
    const teamsPerGroup = tournament.maxTeams / groupCount;
    
    // Split teams into groups
    const groups = Array.from({ length: groupCount }).map((_, groupIndex) => {
      const startIdx = groupIndex * teamsPerGroup;
      const groupTeams = tournament.teams.slice(startIdx, startIdx + teamsPerGroup);
      // If not enough teams registered, fill with TBD
      const fillerNeeded = teamsPerGroup - groupTeams.length;
      if (fillerNeeded > 0) {
        for (let i = 0; i < fillerNeeded; i++) {
          groupTeams.push({ name: "TBD", players: 0 });
        }
      }
      return groupTeams;
    });
    
    return (
      <div className="tournament-bracket group-bracket">
        <h4>Group Stage</h4>
        <div className="groups-container">
          {groups.map((group, groupIndex) => (
            <div key={groupIndex} className="group">
              <div className="group-header">Group {String.fromCharCode(65 + groupIndex)}</div>
              <div className="group-table">
                <div className="group-table-header">
                  <div className="group-table-cell">Pos</div>
                  <div className="group-table-cell team-name">Team</div>
                  <div className="group-table-cell">Pts</div>
                </div>
                {group.map((team, teamIndex) => (
                  <div key={teamIndex} className="group-table-row">
                    <div className="group-table-cell">{teamIndex + 1}</div>
                    <div className="group-table-cell team-name">{team.name}</div>
                    <div className="group-table-cell">0</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <h4 className="knockout-stage-header">Knockout Stage</h4>
        <div className="knockout-mini-bracket" data-groups={groupCount}>
          <div className="bracket-round">
            <div className="round-header">Semi-Finals</div>
            <div className="bracket-match" data-match-index="0" data-round-index="0">
              <div className="bracket-team">Winner Group A</div>
              <div className="bracket-team">Runner-up Group B</div>
            </div>
            <div className="bracket-match" data-match-index="1" data-round-index="0">
              <div className="bracket-team">Winner Group B</div>
              <div className="bracket-team">Runner-up Group A</div>
            </div>
          </div>
          <div className="bracket-round">
            <div className="round-header">Final</div>
            <div className="bracket-match" data-match-index="0" data-round-index="1">
              <div className="bracket-team">SF Winner 1</div>
              <div className="bracket-team">SF Winner 2</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Modify the openTestMatchModal function to create better test data
  const openTestMatchModal = () => {
    // Create more complete test match data
    const testMatch: MatchData = {
      id: 999,
      name: "Semi-Finals 2",
      nextMatchId: 500,
      tournamentRoundText: "Semi-Finals",
      startTime: new Date().toISOString(),
      state: "SCHEDULED",
      participants: [
        { 
          id: "team1", 
          name: "Team Alpha", 
          resultText: "Winner",
          teamInfo: {
            name: "Team Alpha",
            players: 5
          }
        } as ExtendedParticipantData,
        { 
          id: "team2", 
          name: "Team Beta",
          teamInfo: {
            name: "Team Beta",
            players: 5
          }
        } as ExtendedParticipantData
      ],
      venue: "Main Arena"
    };
    
    console.log('Opening test match modal with hardcoded data:', testMatch);
    setSelectedMatch(testMatch);
    setShowMatchModal(true);
  };

  // Function to render the match modal
  const renderMatchModal = () => {
    try {
      console.log('Rendering match modal, selectedMatch:', selectedMatch);
      
      if (!selectedMatch) {
        return (
          <div className="match-modal-overlay" onClick={() => setShowMatchModal(false)}>
            <div className="match-modal" onClick={(e) => e.stopPropagation()}>
              <p>No match selected</p>
              <button onClick={() => setShowMatchModal(false)}>Close</button>
            </div>
          </div>
        );
      }

      // Format match date and time
      const matchDateTime = selectedMatch.startTime 
        ? formatMatchDateTime(selectedMatch.startTime)
        : { date: 'TBD', time: 'TBD' };
        
      // Get match status display
      const getMatchStatusDisplay = () => {
        switch (selectedMatch.state) {
          case 'SCHEDULED': return 'Scheduled';
          case 'RUNNING': return 'In Progress';
          case 'DONE': return 'Completed';
          default: return selectedMatch.state || 'Unknown';
        }
      };
      
      return (
        <div className="match-modal-overlay" onClick={() => setShowMatchModal(false)}>
          <div className="match-modal" onClick={(e) => e.stopPropagation()}>
            <div className="match-modal-header">
              <h2>{selectedMatch.name || 'Unnamed Match'}</h2>
              <button 
                className="close-button" 
                onClick={() => setShowMatchModal(false)}
              >
                &times;
              </button>
            </div>
            
            <div className="match-modal-content">
              <div className="match-info">
                <p><strong>ID:</strong> {selectedMatch.id || 'N/A'}</p>
                <p><strong>Round:</strong> {selectedMatch.tournamentRoundText || 'N/A'}</p>
                <p><strong>Date:</strong> {matchDateTime.date}</p>
                <p><strong>Time:</strong> {matchDateTime.time}</p>
                <p><strong>Status:</strong> {getMatchStatusDisplay()}</p>
              </div>
              
              <div className="match-teams">
                <h3>Teams</h3>
                {selectedMatch.participants && selectedMatch.participants.length > 0 ? (
                  <div className="teams-container">
                    {selectedMatch.participants.map((participant, index) => (
                      <div 
                        key={participant.id || index} 
                        className={`team-item ${selectedMatch.highlightedParticipantId === participant.id ? 'highlighted' : ''}`}
                      >
                        <p className="team-name">{participant.name || 'Unknown Team'}</p>
                        {participant.resultText && (
                          <p className="team-result">{participant.resultText}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No teams assigned</p>
                )}
              </div>
            </div>
            
            <div className="match-modal-footer">
              <button onClick={() => setShowMatchModal(false)}>Close</button>
            </div>
          </div>
        </div>
      );
    } catch (error) {
      console.error('Error rendering match modal:', error);
      return (
        <div className="match-modal-overlay" onClick={() => setShowMatchModal(false)}>
          <div className="match-modal" onClick={(e) => e.stopPropagation()}>
            <div className="match-modal-header">
              <h2>Error</h2>
              <button 
                className="close-button" 
                onClick={() => setShowMatchModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="match-modal-content">
              <p>There was an error displaying the match details.</p>
              <p>{error instanceof Error ? error.message : 'Unknown error'}</p>
            </div>
            <div className="match-modal-footer">
              <button onClick={() => setShowMatchModal(false)}>Close</button>
            </div>
          </div>
        </div>
      );
    }
  };

  // Add a simple test modal function before the renderMatchModal function
  const renderTestModal = () => {
    return (
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999
        }}
        onClick={() => setShowTestModal(false)}
      >
        <div 
          style={{
            backgroundColor: '#202020',
            padding: '30px',
            borderRadius: '15px',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 15px 30px rgba(156, 39, 176, 0.5)',
            position: 'relative'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h2 style={{ color: '#ff80ff', marginTop: 0 }}>Test Modal</h2>
          <p style={{ color: '#e0e0e0' }}>This is a test modal to check if modal rendering is working.</p>
          <button 
            style={{
              backgroundColor: '#9c27b0',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            onClick={() => setShowTestModal(false)}
          >
            Close Modal
          </button>
        </div>
      </div>
    );
  };

  // Format date time string for display
  const formatMatchDateTime = (dateTimeString: string) => {
    console.log('Formatting date time string:', dateTimeString);
    
    // Check if the string is valid
    if (!dateTimeString || dateTimeString === 'TBD' || dateTimeString === 'N/A') {
      console.warn('Invalid date time string:', dateTimeString);
      return { date: 'TBD', time: 'TBD' };
    }
    
    try {
      const date = new Date(dateTimeString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date object created from:', dateTimeString);
        return { date: 'TBD', time: 'TBD' };
      }
      
      // Format date
      const dateOptions: Intl.DateTimeFormatOptions = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      };
      
      // Format time
      const timeOptions: Intl.DateTimeFormatOptions = { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true
      };
      
      return {
        date: date.toLocaleDateString(undefined, dateOptions),
        time: date.toLocaleTimeString(undefined, timeOptions)
      };
    } catch (error) {
      console.error('Error formatting date time:', error);
      return { date: 'Error', time: 'Error' };
    }
  };

  // Simplified rendering - always render the tournament list
  return renderTournamentList();

  // Helper function to render the tournament list
  function renderTournamentList() {
    if (loading) {
      return (
        <div className="tournaments-loading">
          <FaSpinner className="spinner" />
          <p>Loading tournaments...</p>
        </div>
      );
    }
  
    if (error) {
      return (
        <div className="tournaments-error">
          <p>{error}</p>
        </div>
      );
    }
  
    if (tournaments.length === 0) {
      return (
        <div className="tournaments-empty">
          <p>No tournaments found. Be the first to create one!</p>
        </div>
      );
    }
  
    return (
      <div className="tournaments-list">
        {error && (
          <div className="tournament-error-message">
            {error}
          </div>
        )}
        
        {tournaments.map((tournament) => (
          <div 
            key={tournament.id} 
            className={`tournament-card ${expandedTournamentId === tournament.id ? 'expanded' : ''}`}
            onClick={() => toggleExpand(tournament.id)}
          >
            <div className="tournament-card-header">
              {getSportIcon(tournament.sportType)}
              <h3>{tournament.tournamentName}</h3>
              <div className="tournament-actions">
                {deleteConfirmation === tournament.id ? (
                  <div className="delete-confirmation" onClick={(e) => e.stopPropagation()}>
                    <span>Delete tournament?</span>
                    <button className="confirm-delete" onClick={confirmDelete}>Yes</button>
                    <button className="cancel-delete" onClick={cancelDelete}>No</button>
                  </div>
                ) : (
                  <button 
                    className="delete-tournament-btn" 
                    onClick={(e) => handleDeleteClick(e, tournament.id!)}
                    aria-label="Delete tournament"
                  >
                    <FaTrash />
                  </button>
                )}
                <div className="expand-icon">
                  {expandedTournamentId === tournament.id ? <FaChevronUp /> : <FaChevronDown />}
                </div>
              </div>
            </div>
            
            <div className="tournament-card-details">
              <div className="tournament-detail">
                <FaCalendarAlt />
                <span>{formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}</span>
              </div>
              
              <div className="tournament-detail">
                <FaMapMarkerAlt />
                <span>{tournament.location}</span>
              </div>
              
              <div className="tournament-detail">
                <FaUsers />
                <span>{tournament.teams.length} / {tournament.maxTeams} teams</span>
              </div>
              
              <div className="tournament-detail">
                <FaTrophy />
                <span>{tournament.tournamentFormat.charAt(0).toUpperCase() + tournament.tournamentFormat.slice(1)} Format</span>
              </div>
            </div>
            
            {tournament.description && (
              <div className="tournament-description" onClick={(e) => e.stopPropagation()}>
                {tournament.description}
              </div>
            )}
            
            {tournament.teams.length > 0 && (
              <div className="tournament-teams" onClick={(e) => e.stopPropagation()}>
                <h4>Registered Teams:</h4>
                <div className="teams-chips">
                  {tournament.teams.map((team, index) => (
                    <div key={index} className="team-chip">
                      {team.name} ({team.players})
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {expandedTournamentId === tournament.id && (
              <div className="tournament-bracket-section" onClick={(e) => e.stopPropagation()}>
                {renderTournamentBracket(tournament)}
              </div>
            )}
          </div>
        ))}
        
        {/* Render both modals */}
        {showMatchModal && renderMatchModal()}
        {showTestModal && renderTestModal()}
      </div>
    );
  }
} 
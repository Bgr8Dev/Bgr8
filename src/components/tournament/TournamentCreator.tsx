import { useState } from 'react';
import { FaCalendarAlt, FaUsers, FaTrophy, FaMapMarkerAlt, FaInfoCircle, FaPlus, FaSpinner } from 'react-icons/fa';
import '../../styles/tournamentStyles/TournamentCreator.css';
import { createTournament } from '../../services/tournamentService';
import { auth } from '../../firebase/firebase';

type SportType = 'football' | 'badminton' | 'esports';

interface TournamentCreatorProps {
  sportType: SportType;
}

interface Team {
  name: string;
  players: number;
}

export default function TournamentCreator({ sportType }: TournamentCreatorProps) {
  const [tournamentName, setTournamentName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [maxTeams, setMaxTeams] = useState(8);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamName, setTeamName] = useState('');
  const [teamPlayers, setTeamPlayers] = useState(5);
  const [tournamentFormat, setTournamentFormat] = useState('knockout');
  const [eliminationType, setEliminationType] = useState('single');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Set default team players based on sport type
  useState(() => {
    switch (sportType) {
      case 'football':
        setTeamPlayers(11);
        break;
      case 'badminton':
        setTeamPlayers(1);
        break;
      case 'esports':
        setTeamPlayers(5);
        break;
    }
  });

  const handleAddTeam = () => {
    if (teamName.trim() === '') return;
    
    if (teams.length >= maxTeams) {
      setError(`Maximum number of teams (${maxTeams}) reached.`);
      setTimeout(() => setError(null), 3000);
      return;
    }

    const newTeam: Team = {
      name: teamName,
      players: teamPlayers
    };

    setTeams([...teams, newTeam]);
    setTeamName('');
  };

  const handleRemoveTeam = (index: number) => {
    const updatedTeams = [...teams];
    updatedTeams.splice(index, 1);
    setTeams(updatedTeams);
  };

  const resetForm = () => {
    setTournamentName('');
    setStartDate('');
    setEndDate('');
    setLocation('');
    setDescription('');
    setTeams([]);
    setTeamName('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      // Validate dates
      if (new Date(startDate) > new Date(endDate)) {
        throw new Error('Start date must be before end date');
      }
      
      const currentUser = auth.currentUser;
      
      const tournamentData = {
        tournamentName,
        sportType,
        startDate,
        endDate,
        location,
        description,
        maxTeams,
        teams,
        tournamentFormat,
        eliminationType: tournamentFormat === 'knockout' ? eliminationType : null
      };
      
      // Create tournament in Firestore
      await createTournament(tournamentData, currentUser?.uid);
      
      // Show success message
      setSuccess(true);
      resetForm();
      
      // Hide success message after a few seconds
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while creating the tournament');
      console.error('Tournament creation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getSportIcon = () => {
    switch (sportType) {
      case 'football':
        return <FaTrophy className="sport-icon football" />;
      case 'badminton':
        return <FaTrophy className="sport-icon badminton" />;
      case 'esports':
        return <FaTrophy className="sport-icon esports" />;
      default:
        return <FaTrophy className="sport-icon" />;
    }
  };

  const getSportTitle = () => {
    switch (sportType) {
      case 'football':
        return 'B8FC Tournament';
      case 'badminton':
        return 'B8dminton Tournament';
      case 'esports':
        return 'B8Esports Tournament';
      default:
        return 'Tournament';
    }
  };

  return (
    <div className="tournament-creator">
      <div className="tournament-creator-header">
        {getSportIcon()}
        <h3>Create {getSportTitle()}</h3>
      </div>

      {success && (
        <div className="success-message">
          Tournament created successfully! Your tournament has been added to our database.
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="tournament-form">
        <div className="form-group">
          <label>
            <FaCalendarAlt /> Tournament Name
          </label>
          <input 
            type="text" 
            value={tournamentName} 
            onChange={(e) => setTournamentName(e.target.value)}
            placeholder={`Enter ${getSportTitle()} name`}
            required
            disabled={isLoading}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>
              <FaCalendarAlt /> Start Date
            </label>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              required
              disabled={isLoading}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="form-group">
            <label>
              <FaCalendarAlt /> End Date
            </label>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              required
              disabled={isLoading}
              min={startDate || new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        <div className="form-group">
          <label>
            <FaMapMarkerAlt /> Location
          </label>
          <input 
            type="text" 
            value={location} 
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Enter tournament location"
            required
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label>
            <FaInfoCircle /> Description
          </label>
          <textarea 
            value={description} 
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your tournament"
            rows={3}
            disabled={isLoading}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>
              <FaUsers /> Max Teams
            </label>
            <select 
              value={maxTeams} 
              onChange={(e) => setMaxTeams(Number(e.target.value))}
              disabled={isLoading}
            >
              <option value="4">4 Teams</option>
              <option value="8">8 Teams</option>
              <option value="16">16 Teams</option>
              <option value="32">32 Teams</option>
            </select>
          </div>

          <div className="form-group">
            <label>
              <FaTrophy /> Tournament Format
            </label>
            <select 
              value={tournamentFormat} 
              onChange={(e) => setTournamentFormat(e.target.value)}
              disabled={isLoading}
            >
              <option value="knockout">Knockout</option>
              <option value="league">League</option>
              <option value="group">Group Stage + Knockout</option>
            </select>
          </div>
        </div>

        {tournamentFormat === 'knockout' && (
          <div className="form-group">
            <label>
              <FaTrophy /> Elimination Type
            </label>
            <select 
              value={eliminationType} 
              onChange={(e) => setEliminationType(e.target.value)}
              disabled={isLoading}
            >
              <option value="single">Single Elimination</option>
              <option value="double">Double Elimination</option>
            </select>
          </div>
        )}

        <div className="form-group team-section">
          <h4>Add Teams ({teams.length}/{maxTeams})</h4>
          
          <div className="team-input">
            <input 
              type="text" 
              value={teamName} 
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Team name"
              disabled={isLoading}
            />
            <input 
              type="number" 
              value={teamPlayers} 
              onChange={(e) => setTeamPlayers(Number(e.target.value))}
              min="1"
              max={sportType === 'football' ? 11 : (sportType === 'esports' ? 5 : 2)}
              disabled={isLoading}
            />
            <button 
              type="button" 
              onClick={handleAddTeam}
              className="add-team-btn"
              disabled={isLoading}
            >
              <FaPlus /> Add
            </button>
          </div>

          <div className="teams-list">
            {teams.map((team, index) => (
              <div key={index} className="team-item">
                <span>{team.name} ({team.players} players)</span>
                <button 
                  type="button" 
                  onClick={() => handleRemoveTeam(index)}
                  className="remove-team-btn"
                  disabled={isLoading}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <button 
          type="submit" 
          className="create-tournament-btn" 
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <FaSpinner className="spinner" /> Creating Tournament...
            </>
          ) : (
            'Create Tournament'
          )}
        </button>
      </form>
    </div>
  );
} 
declare module 'react-tournament-brackets' {
  import { ReactNode, ComponentType } from 'react';

  export interface ParticipantData {
    id: string | number;
    name: string;
    status?: string | null;
    isWinner?: boolean;
    resultText?: string | null;
    [key: string]: any;
  }

  export interface MatchData {
    id: number;
    name?: string;
    nextMatchId: number | null;
    tournamentRoundText: string;
    startTime: string;
    state: string;
    participants: ParticipantData[];
    [key: string]: any;
  }

  export interface SVGViewerProps {
    width: number;
    height: number;
    background?: string;
    SVGBackground?: string;
    children: ReactNode;
    [key: string]: any;
  }

  export interface MatchComponentProps {
    match: MatchData;
    onMouseEnter?: (match: MatchData) => void;
    onMouseLeave?: (match: MatchData) => void;
    onClickMatch?: (match: MatchData) => void;
    teamNameFallback?: string;
    resultFallback?: string;
    [key: string]: any;
  }

  export interface BracketProps {
    matches: MatchData[];
    matchComponent: ComponentType<MatchComponentProps>;
    svgWrapper: (props: { children: ReactNode } & Record<string, any>) => JSX.Element;
    onMatchClick?: (match: MatchData) => void;
    onPartyClick?: (participant: ParticipantData, match: MatchData) => void;
    options?: {
      style?: {
        roundHeader?: {
          fontSize?: string;
          fontWeight?: number;
          color?: string;
          [key: string]: any;
        };
        connectorColor?: string;
        connectorColorHighlight?: string;
        teamNameFontSize?: string;
        matchComponentBackground?: string;
        matchComponentColorHighlight?: string;
        [key: string]: any;
      };
      [key: string]: any;
    };
    [key: string]: any;
  }

  export const Match: ComponentType<MatchComponentProps>;
  export const SVGViewer: ComponentType<SVGViewerProps>;
  export const SingleEliminationBracket: ComponentType<BracketProps>;
  export const DoubleEliminationBracket: ComponentType<BracketProps>;
} 
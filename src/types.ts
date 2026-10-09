export type TabRoute = 'home' | 'scan' | 'activity' | 'profile';

export type FlowRoute =
  | 'security'
  | 'authorized-devices'
  | 'limits-security'
  | 'compliance'
  | 'help'
  | 'notifications';

export type AppRoute = TabRoute | FlowRoute;
export type Navigate = (route: AppRoute) => void;

export type EngineeringRoute =
  | 'send'
  | 'receive'
  | 'deposit'
  | 'cards'
  | 'integration-readiness'
  | 'backend-contract-lab';

export type EngineeringNavigate = (route: AppRoute | EngineeringRoute) => void;

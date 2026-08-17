export type TabRoute = 'home' | 'cards' | 'scan' | 'activity' | 'profile';
export type FlowRoute = 'send' | 'receive' | 'deposit';
export type AppRoute = TabRoute | FlowRoute;

export type Navigate = (route: AppRoute) => void;

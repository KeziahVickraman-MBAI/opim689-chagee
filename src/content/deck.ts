/* Wording carried over from the deck (deck/build_deck.py at the commit in vendor/source.json), so the app and the
 * slides say the same thing. Numbers are not typed here: sections insert them from assumptions.json and the model. */
import type { SectionId } from '../types';

/* Owner chips: one per team, as on the deck's gate cards. */
export type Role = 'entry' | 'crm' | 'supply' | 'format' | 'ops';
export const ROLES: Record<Role, string> = {
  entry: 'Market-entry leads', crm: 'Membership / CRM', supply: 'Supply chain / planning',
  format: 'Store format & franchisee', ops: 'Store operations',
};

/* Context slide: "Where AI enters a new store's opening". Today = the deck's reading of public sources and one
 * industry conversation, not a Chagee statement. */
export const AI_STEPS: { id: string; name: string; today: string; aiAdds: string; who: string; section: SectionId; where: string }[] = [
  { id: 'members', name: 'Members', today: 'Members order through the app (our understanding).',
    aiAdds: 'Read sign-ups and pre-orders as early demand evidence.', who: 'Membership / CRM', section: 'predict', where: 'Predict: member signal' },
  { id: 'forecast', name: 'Forecast', today: 'Judgement-led by a local General Manager (our reading).',
    aiAdds: 'A proposed demand range from member signals, with hype and habit separated by existing-market proxies.',
    who: 'Market-entry leads and GMs', section: 'predict', where: 'Predict: 12-week forecast' },
  { id: 'stock', name: 'Opening inventory', today: 'Direct, standardised sourcing of tea and milk for domestic stores (company release).',
    aiAdds: 'Turn the forecast into an item-by-item opening list; size fresh milk with newsvendor logic as the worked example.',
    who: 'Supply chain / planning', section: 'provision', where: 'Provision: inventory plan and fresh-milk example' },
  { id: 'counter', name: 'Counter', today: 'Moving toward semi-automation: QR-scan dispensing, Chagee Express.',
    aiAdds: 'Simulate the counter before the store exists, and flag which inputs would change the choice.',
    who: 'Store format / equipment; franchisees', section: 'counter', where: 'Counter: cost comparison' },
  { id: 'after', name: 'After opening', today: 'Not covered by public sources.',
    aiAdds: 'Compare actual demand with the range to narrow the next market’s forecast.',
    who: 'Market-entry leads', section: 'review', where: 'Review: updated scenario' },
];

/* Provision: from forecast to purchase order. */
export const INVENTORY_CHAIN: [string, string][] = [
  ['Forecast cups', 'The whole store’s weekly range (Predict). Cups alone are not enough: drinks use different ingredients.'],
  ['Product mix', 'Share of each drink and format (size, hot or cold). Requires menu-mix data.'],
  ['Recipes and materials', 'Ingredient requirement = forecast drink quantities × ingredient amount per drink. Packaging follows orders and formats.'],
  ['Deliveries and stock', 'The order nets off usable stock and deliveries due, adds expected losses, and fits lead times, shelf life, storage and supplier minimums.'],
];

export const INVENTORY_COLS = ['Item', 'What drives its demand', 'Main constraint', 'Opening decision', 'Replenishment', 'Needed for a number'];
export const INVENTORY_MATRIX: string[][] = [
  ['Tea leaves', 'Tea drinks in the mix × tea per drink',
   'Sourcing lead time, minimum orders, storage; quality fades with age and handling, so tea also has waste and quality risk',
   'How much to hold before opening: the opening weeks plus the time a reorder takes to arrive',
   'Reorder when stock reaches usage over the lead time plus a buffer', 'Recipes · supplier lead time · minimum order · usable life'],
  ['Fresh milk and alternatives', 'Milk drinks × milk per drink; alternatives by customer choice',
   'Short shelf life, chilled space, delivery frequency', 'First fresh-milk delivery: the worked example below',
   'Each delivery sized on actual sales', 'Recipes · share of alternative milks · delivery schedule'],
  ['Other ingredients', 'Each recipe’s amounts', 'Each has its own shelf life and supplier terms',
   'Plan per recipe and shelf life: perishables like milk, longer-life items like tea', 'Per item’s usage and lead time',
   'Menu recipes · shelf lives · supplier terms'],
  ['Cups, lids, seals, packaging', 'Orders by format', 'Lead time, minimum orders, bulky storage',
   'Cover opening demand plus the reorder lead time: no cup or seal, no sale, even with ingredients ready',
   'Reorder on usage and lead time', 'Format mix · supplier lead time · storage space'],
];
export const INVENTORY_NOTE = 'Origin (imported or local) is not public for overseas stores: Chagee’s direct sourcing of tea and milk is ' +
  'documented for its domestic operations. Quantities, lead times, shelf lives and service levels are not in our sources, so none are shown.';

/* Appendix A3: claims the deck deliberately does not make. */
export const CLAIMS_NOT_MADE = [
  'That Chagee is first at anything, or that anything is not available in the market.',
  'Overseas milk sourcing details: unknown, so milk costs are generic.',
  'Any Chagee internal cost, forecast method or automation plan not in the deck’s source ledger.',
  'Measured serve times: every service time here is modelled.',
  'That member data narrows the forecast band: the narrowing is an assumption, tested as a sensitivity.',
  'That all-human or mixed is proven cheaper: the gap is small and rests on a simplified staffing model.',
  'A saving against today’s practice: the benefit is a modelled avoided cost against a standard counter.',
  'Anything about menu prices: that would need a demand-elasticity assumption the model does not have.',
  'That the prototype contains a trained AI model: it calculates from synthetic, assumed inputs.',
  'That rerunning the model with observed inputs validates it, or proves machines should be added.',
  'That uncertainty never matters for the counter: the finding holds for the scenarios tested.',
  'Sales revenue or a payback for Chagee: the A4 business case sets modelled avoided cost against approved but illustrative costs.',
  'Quantities, lead times, shelf lives, minimum orders or origin for tea, other ingredients or packaging.',
  'Inventory savings beyond fresh milk: tea, other ingredients and packaging have not been estimated.',
  'That inventory and counter are optimised together: the prototype treats them separately.',
];

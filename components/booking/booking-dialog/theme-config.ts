// Theme configuration for BookingDialog templates
export type BookingDialogTemplate = 'modern' | 'classic' | 'minimal' | 'beauty' | 'healthcare' | 'healthcarev2' | 'sneat';

export interface ThemeConfig {
  dialogClass: string;
  headerClass: string;
  cardClass: string;
  buttonClass: string;
  inputClass: string;
  badgeClass: string;
}

const themes: Record<BookingDialogTemplate, ThemeConfig> = {
  modern: {
    dialogClass: 'bg-black/95 border border-white/20',
    headerClass: 'text-white border-b border-white/10',
    cardClass: 'bg-white/5 border border-white/10 hover:border-white/20',
    buttonClass: 'bg-blue-600 hover:bg-blue-700 text-white',
    inputClass: 'bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:border-blue-500',
    badgeClass: 'bg-blue-500/20 text-blue-200 border border-blue-500/30',
  },
  minimal: {
    dialogClass: 'bg-white border border-gray-200',
    headerClass: 'text-gray-900 border-b border-gray-200',
    cardClass: 'bg-gray-50 border border-gray-200 hover:border-gray-300',
    buttonClass: 'bg-black hover:bg-gray-900 text-white',
    inputClass: 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-black',
    badgeClass: 'bg-gray-200 text-gray-900 border border-gray-300',
  },
  beauty: {
    dialogClass: 'bg-gradient-to-br from-white via-pink-50 to-purple-50 border border-pink-200',
    headerClass: 'text-gray-900 border-b border-pink-200 bg-gradient-to-r from-pink-100/50 to-purple-100/50',
    cardClass: 'bg-white border border-pink-200 hover:border-pink-300 shadow-sm',
    buttonClass: 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white',
    inputClass: 'bg-white border-pink-200 text-gray-900 placeholder:text-gray-500 focus:border-pink-400 focus:ring-pink-200',
    badgeClass: 'bg-pink-100 text-pink-800 border border-pink-300',
  },
  healthcare: {
    dialogClass: 'bg-white border border-blue-200 shadow-lg',
    headerClass: 'text-gray-900 border-b border-blue-200 bg-blue-50',
    cardClass: 'bg-blue-50 border border-blue-200 hover:border-blue-300',
    buttonClass: 'bg-blue-600 hover:bg-blue-700 text-white',
    inputClass: 'bg-white border-blue-200 text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-200',
    badgeClass: 'bg-blue-100 text-blue-800 border border-blue-300',
  },
  healthcarev2: {
    dialogClass: 'bg-white border border-emerald-200 shadow-lg',
    headerClass: 'text-gray-900 border-b border-emerald-200 bg-emerald-50',
    cardClass: 'bg-emerald-50 border border-emerald-200 hover:border-emerald-300',
    buttonClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    inputClass: 'bg-white border-emerald-200 text-gray-900 placeholder:text-gray-500 focus:border-emerald-500 focus:ring-emerald-200',
    badgeClass: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
  },
  classic: {
    dialogClass: 'bg-white border border-gray-300 shadow-xl',
    headerClass: 'text-gray-900 border-b border-gray-300 bg-gray-100',
    cardClass: 'bg-gray-50 border border-gray-300 hover:border-gray-400',
    buttonClass: 'bg-gray-700 hover:bg-gray-800 text-white',
    inputClass: 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-gray-700',
    badgeClass: 'bg-gray-200 text-gray-800 border border-gray-400',
  },
  sneat: {
    dialogClass: 'bg-white dark:bg-[#2b2c40] border border-gray-200 dark:border-[#4e4f6c] shadow-card rounded-card',
    headerClass: 'text-txt-primary dark:text-[#d5d5e2] border-b border-gray-200 dark:border-[#4e4f6c] pb-4',
    cardClass: 'bg-gray-50 dark:bg-[#232333] border border-gray-200 dark:border-[#4e4f6c] rounded-card hover:shadow-md transition-all duration-200',
    buttonClass: 'bg-primary text-white shadow-md shadow-primary/20 hover:bg-[#5f61e6] hover:shadow-lg transition-all duration-200 ease-in-out rounded-md',
    inputClass: 'bg-gray-50 dark:bg-[#2b2c40] border-transparent text-txt-primary dark:text-[#d5d5e2] placeholder:text-txt-muted dark:placeholder:text-[#7e7f96] focus:bg-white dark:focus:bg-[#232333] focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-150 rounded-md',
    badgeClass: 'bg-primary-light dark:bg-[#35365f] text-primary dark:text-[#a5a7ff] px-3 py-1 rounded text-xs font-semibold',
  },
};

export function getThemeConfig(template?: string): ThemeConfig {
  return themes[(template as BookingDialogTemplate) || 'sneat'] || themes['sneat'];
}

// Shared session state: who is logged in + the billing meter.
import { t } from './i18n.js';
import { era } from './era.js';
const S = { user: 'tamu', start: 0, minutes: 60, pc: 7, wallpaper: era().wall };
export const session = S;
export const getUser = () => S.user;

const NAMES = ['ganteng', 'cewe_manis', 'cowo_cool', 'anak_gaul', 'raja_rush', 'si_kancil', 'ksatria_baja', 'pangeran_cinta', 'gadis_desa', 'bocah_ajaib', 'jagoan_neon', 'bidadari'];
const WORDS = ['lumba', 'warnet', 'telkom', 'kancil', 'bakso', 'cendol', 'sate', 'pecel', 'indomie', 'kopi'];
const r = (n) => (Math.random() * n) | 0;

/** Random "voucher" credentials, like the slip the operator hands you. */
export function newVoucher() {
  const user = `${NAMES[r(NAMES.length)]}${['', '_', ''][r(3)]}${r(90) + 10}`;
  const pass = `${WORDS[r(WORDS.length)]}${r(9000) + 1000}`;
  const { rate, malam } = era();
  const pkg = [[60, rate, t('1 Jam')], [120, rate * 2, t('2 Jam')], [180, rate * 3 - 1000, t('Paket 3 Jam')], [360, malam, t('Paket Malam')]][r(4)];
  return { user, pass, minutes: pkg[0], price: pkg[1], pkgName: pkg[2], pc: r(20) + 1 };
}

export function startBilling(v) { S.user = v.user; S.minutes = v.minutes; S.start = Date.now(); S.pc = v.pc; S.price = v.price; S.pkgName = v.pkgName; }
export function remaining() { return Math.max(0, S.minutes * 60 - Math.floor((Date.now() - S.start) / 1000)); }
export function used() { return Math.floor((Date.now() - S.start) / 1000); }
export function addTime(min) { S.minutes += min; S.price += Math.round((min / 60) * era().rate); }
export const fmt = (s) => [s / 3600, (s % 3600) / 60, s % 60].map((n) => String(Math.floor(n)).padStart(2, '0')).join(':');
export const rupiah = (n) => 'Rp ' + n.toLocaleString('id-ID');

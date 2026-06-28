export const AUTH_DOMAIN = process.env.NEXT_PUBLIC_AUTH_DOMAIN || "@financeiro.app";

export function toLoginEmail(usuario: string) {
  const valor = usuario.trim();
  return valor.includes("@") ? valor : `${valor}${AUTH_DOMAIN}`;
}

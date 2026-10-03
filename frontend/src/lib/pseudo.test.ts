import { suggestPseudo } from '@/lib/pseudo';
import { describe, expect, it } from 'vitest';

describe('suggestPseudo', () => {
  it('garde un prénom accentué', () => {
    expect(suggestPseudo('Inès')).toBe('Inès');
  });

  it('retire les caractères refusés et coupe à 30 caractères', () => {
    expect(suggestPseudo('Jean-Ève 🎲')).toBe('Jean-Ève');
    expect(suggestPseudo('a'.repeat(40))).toHaveLength(30);
  });

  it('ne propose rien de trop court', () => {
    expect(suggestPseudo('Al')).toBe('');
    expect(suggestPseudo(undefined)).toBe('');
  });
});

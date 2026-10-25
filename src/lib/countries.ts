import { Country, State } from 'country-state-city';

export interface CountryItem {
  isoCode: string;
  name: string;
  flag: string;
}

/**
 * All official world countries from the country-state-city npm bundle
 */
export const COUNTRIES: CountryItem[] = Country.getAllCountries().map((c) => ({
  isoCode: c.isoCode,
  name: c.name,
  flag: c.flag,
}));

export const COUNTRY_NAMES: string[] = COUNTRIES.map((c) => c.name);

/**
 * Fetch states / provinces for a given country ISO code or name
 */
export function getStatesForCountry(countryIsoOrName: string) {
  if (!countryIsoOrName) return [];
  const found = Country.getAllCountries().find(
    (c) => c.isoCode === countryIsoOrName || c.name.toLowerCase() === countryIsoOrName.toLowerCase()
  );
  if (!found) return [];
  return State.getStatesOfCountry(found.isoCode);
}

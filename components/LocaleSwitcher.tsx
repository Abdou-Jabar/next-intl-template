import { useLocale, useTranslations } from "next-intl";
import LocalSwitcherSelect from "./LocalSwitcherSelect";
import { locales } from "@/config";

export default function LocaleSwitcher(){
  const t = useTranslations("LocaleSwitcher");
  const locale = useLocale();
  return(
    <LocalSwitcherSelect defaultValue={locale} label={t('label')}>
      {locales.map((curr) => (
        <option key={curr} value={curr}>
          {t("locale", {locale: curr})}
        </option>
      ))}
    </LocalSwitcherSelect>
  )
}
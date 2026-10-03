import { Check, Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useFetcher } from "react-router";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { AVAILABLE_LANGUAGES, getLanguageLabel } from "~/lib/i18n.constants";

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const fetcher = useFetcher();

  function changeLanguage(locale: string) {
    // Instant UI feedback...
    void i18n.changeLanguage(locale);
    // ...then persist the preference in the `lng` cookie.
    fetcher.submit({ locale }, { method: "post", action: "/api/actions/set-locale" });
  }

  return (
    <DropdownMenu dir={i18n.dir(i18n.language)}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("languages")}>
          <Languages className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t("languages")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {AVAILABLE_LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang}
            onSelect={() => changeLanguage(lang)}
            className="justify-between"
          >
            {getLanguageLabel(lang)}
            {i18n.language === lang && <Check className="size-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

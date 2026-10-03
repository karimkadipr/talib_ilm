import { useTranslation } from "react-i18next";
import { data, href, Link } from "react-router";
import { LogoMark } from "~/components/logo";
import { Button } from "~/components/ui/button";

// Catch-all 404. Unmatched URLs would otherwise skip the root loader and render
// the error boundary without a ready i18next instance.
export async function loader() {
  return data(null, { status: 404 });
}

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center py-24 text-center">
      <LogoMark className="size-14 opacity-80" />
      <h1 className="mt-6 text-3xl font-semibold">{t("notFound.title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("notFound.description")}</p>
      <Button asChild className="mt-6 rounded-full">
        <Link to={href("/")}>{t("notFound.backHome")}</Link>
      </Button>
    </div>
  );
}

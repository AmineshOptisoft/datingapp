import VerifyClient from "./VerifyClient";

// This page depends on URL query params; avoid build-time static prerendering.
export const dynamic = "force-dynamic";

type VerifyPageProps = {
  searchParams?: {
    email?: string;
    phone?: string;
    userId?: string;
  };
};

export default function VerifyPage({ searchParams }: VerifyPageProps) {
  const email = typeof searchParams?.email === "string" ? searchParams.email : "";
  const phone = typeof searchParams?.phone === "string" ? searchParams.phone : "";
  const userId =
    typeof searchParams?.userId === "string" ? searchParams.userId : "";

  return <VerifyClient email={email} phone={phone} userId={userId} />;
}


import { redirect } from "next/navigation"

// /settings has no content of its own — the L2 rail in the layout is the
// navigator. Redirect to the first section so refreshing /settings is sane.
export default function SettingsPage() {
  redirect("/settings/general")
}

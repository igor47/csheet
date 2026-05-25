import type { ComputedCampaign } from "@src/services/campaigns/compute"
import type { ComputedCharacter } from "@src/services/computeCharacter"
import { CharacterSheetBody, PRINT_STYLES } from "./CharacterPrint"

interface CampaignPrintProps {
  campaign: ComputedCampaign
  characters: ComputedCharacter[]
}

const CoverPage = ({
  campaign,
  characters,
}: {
  campaign: ComputedCampaign
  characters: ComputedCharacter[]
}) => (
  <div style="padding-bottom: 1in;">
    <div style="border-bottom: 2pt solid #1a1a1a; padding-bottom: 8pt; margin-bottom: 16pt;">
      <div style="font-size: 6pt; text-transform: uppercase; letter-spacing: 0.1em; color: #666; margin-bottom: 4pt;">
        Campaign
      </div>
      <div style="font-size: 22pt; font-weight: bold; margin: 0 0 4pt 0;">{campaign.name}</div>
      {campaign.description && (
        <div style="font-size: 9pt; color: #555; margin-top: 4pt;">{campaign.description}</div>
      )}
    </div>

    <div style="font-size: 7pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; color: #444; border-bottom: 0.5pt solid #bbb; padding-bottom: 3pt; margin-bottom: 8pt;">
      Party
    </div>

    {characters.map((char) => {
      const classLabel = char.classes
        .map((c) => `${c.class.charAt(0).toUpperCase() + c.class.slice(1)} ${c.level}`)
        .join(" / ")
      return (
        <div
          style="display:flex; justify-content:space-between; align-items:baseline; padding: 4pt 0; border-bottom: 0.5pt solid #eee; font-size: 9pt;"
          key={char.id}
        >
          <span style="font-weight: bold;">{char.name}</span>
          <span style="color: #555; font-size: 8pt; text-transform: capitalize;">{classLabel}</span>
          <span style="color: #777; font-size: 7.5pt; text-transform: capitalize;">
            {char.species ?? ""}
          </span>
          <span style="color: #777; font-size: 7.5pt; text-transform: capitalize;">
            {char.background ?? ""}
          </span>
        </div>
      )
    })}

    <div style="margin-top: 20pt; font-size: 7pt; color: #aaa;">
      Printed {new Date().toLocaleDateString()}
    </div>
  </div>
)

export const CampaignPrint = ({ campaign, characters }: CampaignPrintProps) => (
  <html lang="en">
    <head>
      <title>{campaign.name} — Party Sheets</title>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: fully controlled CSS string, not user input */}
      <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />
    </head>
    <body>
      <div class="action-bar">
        <button type="button" onclick="window.print()">
          Print / Save as PDF
        </button>
        <a href={`/campaigns/${campaign.id}`}>← Back to campaign</a>
      </div>
      <div class="print-sheet">
        <CoverPage campaign={campaign} characters={characters} />
        {characters.map((char) => (
          <div key={char.id} style="break-before: page; page-break-before: always;">
            <CharacterSheetBody character={char} />
          </div>
        ))}
      </div>
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: fully controlled script string, not user input */}
      <script dangerouslySetInnerHTML={{ __html: "window.print()" }} />
    </body>
  </html>
)

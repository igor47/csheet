import { AbilitiesEditForm } from "@src/components/AbilitiesEditForm"
import { AbilityHistory } from "@src/components/AbilityHistory"
import { CastSpellForm } from "@src/components/CastSpellForm"
import { Character } from "@src/components/Character"
import { CharacterInfo } from "@src/components/CharacterInfo"
import { CharacterNew } from "@src/components/CharacterNew"
import { Characters } from "@src/components/Characters"
import { ClassEditForm } from "@src/components/ClassEditForm"
import { ClassHistory } from "@src/components/ClassHistory"
import { CurrentStatus } from "@src/components/CurrentStatus"
import { HitDiceEditForm } from "@src/components/HitDiceEditForm"
import { HitDiceHistory } from "@src/components/HitDiceHistory"
import { HitPointsEditForm } from "@src/components/HitPointsEditForm"
import { HitPointsHistory, type HPHistoryEvent } from "@src/components/HitPointsHistory"
import { LearnSpellForm } from "@src/components/LearnSpellForm"
import { NotesHistory } from "@src/components/NotesHistory"
import { NotesSaveIndicator } from "@src/components/NotesSaveIndicator"
import { PreparedSpellsHistory } from "@src/components/PreparedSpellsHistory"
import { PrepareSpellForm } from "@src/components/PrepareSpellForm"
import { AbilitiesPanel } from "@src/components/panels/AbilitiesPanel"
import { SkillsPanel } from "@src/components/panels/SkillsPanel"
import { SpellsPanel } from "@src/components/panels/SpellsPanel"
import { TraitsPanel } from "@src/components/panels/TraitsPanel"
import { SessionNotes } from "@src/components/SessionNotes"
import { SkillsEditForm } from "@src/components/SkillsEditForm"
import { SkillsHistory } from "@src/components/SkillsHistory"
import { SpellbookHistory } from "@src/components/SpellbookHistory"
import { SpellCastResult } from "@src/components/SpellCastResult"
import { SpellSlotsEditForm } from "@src/components/SpellSlotsEditForm"
import { SpellSlotsHistory } from "@src/components/SpellSlotsHistory"
import { TraitEditForm } from "@src/components/TraitEditForm"
import { TraitHistory } from "@src/components/TraitHistory"
import { UpdateAvatarForm } from "@src/components/UpdateAvatarForm"
import { ModalContent } from "@src/components/ui/ModalContent"
import { getDb } from "@src/db"
import { findByCharacterId as findAbilityChanges } from "@src/db/char_abilities"
import { findByCharacterId as findHitDiceChanges } from "@src/db/char_hit_dice"
import { findByCharacterId as findHPChanges } from "@src/db/char_hp"
import { findByCharacterId } from "@src/db/char_levels"
import {
  create as createNote,
  findById as findNoteById,
  findByCharacterId as findNotes,
  getCurrent as getCurrentNote,
} from "@src/db/char_notes"
import { findByCharacterId as findSkillChanges } from "@src/db/char_skills"
import { findByCharacterId as findSpellSlotChanges } from "@src/db/char_spell_slots"
import { findByCharacterId as findLearnedSpellChanges } from "@src/db/char_spells_learned"
import { findByCharacterId as findPreparedSpellChanges } from "@src/db/char_spells_prepared"
import { findByCharacterId as findTraits } from "@src/db/char_traits"
import { countArchivedByUserId } from "@src/db/characters"
import { logger } from "@src/lib/logger"
import { setFlashMsg } from "@src/middleware/flash"
import { addLevel } from "@src/services/addLevel"
import { addTrait } from "@src/services/addTrait"
import { archiveCharacter } from "@src/services/archiveCharacter"
import { castSpell } from "@src/services/castSpell"
import { computeCharacter } from "@src/services/computeCharacter"
import { createCharacter } from "@src/services/createCharacter"
import { learnSpell } from "@src/services/learnSpell"
import { listCharacters } from "@src/services/listCharacters"
import { LongRestApiSchema, longRest } from "@src/services/longRest"
import { prepareSpell } from "@src/services/prepareSpell"
import { saveNotes } from "@src/services/saveNotes"
import { unarchiveCharacter } from "@src/services/unarchiveCharacter"
import { updateAbilities } from "@src/services/updateAbilities"
import { updateAvatar } from "@src/services/updateAvatar"
import { updateHitDice } from "@src/services/updateHitDice"
import { updateHitPoints } from "@src/services/updateHitPoints"
import { updateSkills } from "@src/services/updateSkills"
import { updateSpellSlots } from "@src/services/updateSpellSlots"
import { Hono } from "hono"

export const characterRoutes = new Hono()

characterRoutes.get("/characters", async (c) => {
  const user = c.var.user!
  const showArchived = c.req.query("show_archived") === "true"

  const characters = await listCharacters(getDb(c), user.id, showArchived)
  const archivedCount = await countArchivedByUserId(getDb(c), user.id)

  // Redirect to /new if there are no characters at all
  const activeCharacters = characters.filter((char) => char.archived_at === null)
  if (activeCharacters.length === 0 && archivedCount === 0) {
    await setFlashMsg(c, "Create a character to get started!", "info")
    return c.redirect("/characters/new")
  }

  return c.render(
    <Characters
      characters={characters}
      showArchived={showArchived}
      archivedCount={archivedCount}
    />,
    {
      title: "My Characters",
    }
  )
})

characterRoutes.get("/characters/new", (c) => {
  return c.render(<CharacterNew />, { title: "New Character" })
})

characterRoutes.post("/characters/new", async (c) => {
  const user = c.var.user!
  const body = (await c.req.parseBody()) as Record<string, string>

  const result = await createCharacter(getDb(c), user, body)

  if (!result.complete) {
    return c.html(<CharacterNew values={result.values} errors={result.errors} />)
  }

  await setFlashMsg(c, "Character created successfully!", "success")
  c.header("HX-Redirect", `/characters/${result.character.id}`)
  return c.body(null, 204)
})

characterRoutes.get("/characters/:id", async (c) => {
  const id = c.req.param("id") as string
  const char = await computeCharacter(getDb(c), id)
  if (!char) {
    await setFlashMsg(c, "Character not found", "error")
    return c.redirect("/characters")
  }

  const currentNote = await getCurrentNote(getDb(c), id)

  return c.render(<Character character={char} currentNote={currentNote} />, {
    title: "Character Sheet",
  })
})

characterRoutes.post("/characters/:id/archive", async (c) => {
  const characterId = c.req.param("id") as string
  const user = c.var.user!

  const char = await computeCharacter(getDb(c), characterId)
  if (!char) {
    await setFlashMsg(c, "Character not found", "error")
    c.header("HX-Redirect", "/characters")
    return c.body(null, 404)
  }

  // Verify ownership
  if (char.user_id !== user.id) {
    await setFlashMsg(c, "Unauthorized", "error")
    c.header("HX-Redirect", "/characters")
    return c.body(null, 403)
  }

  const result = await archiveCharacter(getDb(c), char)

  if (!result.complete) {
    await setFlashMsg(c, result.errors._form || "Failed to archive character", "error")
    c.header("HX-Redirect", "/characters")
    return c.body(null, 400)
  }

  await setFlashMsg(c, `Character "${char.name}" has been archived`, "success")
  c.header("HX-Redirect", "/characters?show_archived=true")
  return c.body(null, 204)
})

characterRoutes.post("/characters/:id/unarchive", async (c) => {
  const characterId = c.req.param("id") as string
  const user = c.var.user!

  const char = await computeCharacter(getDb(c), characterId)
  if (!char) {
    await setFlashMsg(c, "Character not found", "error")
    c.header("HX-Redirect", "/characters?show_archived=true")
    return c.body(null, 404)
  }

  // Verify ownership
  if (char.user_id !== user.id) {
    await setFlashMsg(c, "Unauthorized", "error")
    c.header("HX-Redirect", "/characters?show_archived=true")
    return c.body(null, 403)
  }

  const result = await unarchiveCharacter(getDb(c), char)

  if (!result.complete) {
    await setFlashMsg(c, result.errors._form || "Failed to unarchive character", "error")
    c.header("HX-Redirect", "/characters?show_archived=true")
    return c.body(null, 400)
  }

  await setFlashMsg(c, `Character "${char.name}" has been restored`, "success")
  c.header("HX-Redirect", "/characters")
  return c.body(null, 204)
})

characterRoutes.post("/characters/:id/edit/class", async (c) => {
  const characterId = c.req.param("id") as string
  const body = (await c.req.parseBody()) as Record<string, string>

  const char = await computeCharacter(getDb(c), characterId)
  if (!char) {
    await setFlashMsg(c, "Character not found", "error")
    c.header("HX-Redirect", `/characters`)
    return c.body(null, 204)
  }

  const result = await addLevel(getDb(c), char, body)

  if (!result.complete) {
    return c.html(<ClassEditForm character={char} values={result.values} errors={result.errors} />)
  }

  const updatedChar = (await computeCharacter(getDb(c), characterId))!
  c.header("HX-Trigger", "closeEditModal")
  return c.html(
    <>
      <CharacterInfo character={updatedChar} swapOob={true} />
      <AbilitiesPanel character={updatedChar} swapOob={true} />
      <SkillsPanel character={updatedChar} swapOob={true} />
      <SpellsPanel character={updatedChar} swapOob={true} />
      <TraitsPanel character={updatedChar} swapOob={true} />
    </>
  )
})

characterRoutes.post("/characters/:id/edit/hitpoints", async (c) => {
  const characterId = c.req.param("id") as string
  const body = (await c.req.parseBody()) as Record<string, string>

  const char = await computeCharacter(getDb(c), characterId)
  if (!char) {
    await setFlashMsg(c, "Character not found", "error")
    c.header("HX-Redirect", `/characters`)
    return c.body(null, 204)
  }

  const result = await updateHitPoints(getDb(c), char, body)

  if (!result.complete) {
    return c.html(
      <HitPointsEditForm
        characterId={characterId}
        currentHP={char.currentHP}
        maxHitPoints={char.maxHitPoints}
        values={result.values}
        errors={result.errors}
      />
    )
  }

  const updatedChar = (await computeCharacter(getDb(c), characterId))!

  c.header("HX-Trigger", "closeEditModal")
  return c.html(
    <>
      <CharacterInfo character={updatedChar} swapOob={true} />
      <CurrentStatus character={updatedChar} swapOob={true} />
    </>
  )
})

characterRoutes.post("/characters/:id/edit/hitdice", async (c) => {
  const characterId = c.req.param("id") as string
  const char = await computeCharacter(getDb(c), characterId)
  if (!char) {
    await setFlashMsg(c, "Character not found", "error")
    c.header("HX-Redirect", `/characters`)
    return c.body(null, 204)
  }

  const body = (await c.req.parseBody()) as Record<string, string>
  const result = await updateHitDice(getDb(c), char, body)

  if (!result.complete) {
    return c.html(
      <HitDiceEditForm
        characterId={characterId}
        allHitDice={char.hitDice}
        availableHitDice={char.availableHitDice}
        values={result.values}
        errors={result.errors}
      />
    )
  }

  const updatedChar = (await computeCharacter(getDb(c), characterId))!
  c.header("HX-Trigger", "closeEditModal")
  return c.html(
    <>
      <CharacterInfo character={updatedChar} swapOob={true} />
      <CurrentStatus character={updatedChar} swapOob={true} />
    </>
  )
})

characterRoutes.post("/characters/:id/edit/spellslots", async (c) => {
  const characterId = c.req.param("id") as string
  const body = (await c.req.parseBody()) as Record<string, string>

  const char = await computeCharacter(getDb(c), characterId)
  if (!char) {
    await setFlashMsg(c, "Character not found", "error")
    c.header("HX-Redirect", `/characters`)
    return c.body(null, 204)
  }

  const result = await updateSpellSlots(getDb(c), char, body)

  if (!result.complete) {
    return c.html(
      <SpellSlotsEditForm character={char} values={result.values} errors={result.errors} />
    )
  }

  const updatedChar = (await computeCharacter(getDb(c), characterId))!
  c.header("HX-Trigger", "closeEditModal")
  return c.html(
    <>
      <SpellsPanel character={updatedChar} swapOob={true} />
      <CurrentStatus character={updatedChar} swapOob={true} />
    </>
  )
})

characterRoutes.post("/characters/:id/edit/prepspell", async (c) => {
  const characterId = c.req.param("id") as string
  const body = (await c.req.parseBody()) as Record<string, string>

  const char = await computeCharacter(getDb(c), characterId)
  if (!char) {
    await setFlashMsg(c, "Character not found", "error")
    c.header("HX-Redirect", `/characters`)
    return c.body(null, 204)
  }

  const result = await prepareSpell(getDb(c), char, body)

  if (!result.complete) {
    return c.html(
      <PrepareSpellForm character={char} values={result.values} errors={result.errors} />
    )
  }

  const updatedChar = (await computeCharacter(getDb(c), characterId))!
  c.header("HX-Trigger", "closeEditModal")
  return c.html(<SpellsPanel character={updatedChar} swapOob={true} />)
})

characterRoutes.post("/characters/:id/edit/spellbook", async (c) => {
  const characterId = c.req.param("id") as string
  const body = (await c.req.parseBody()) as Record<string, string>

  const char = await computeCharacter(getDb(c), characterId)
  if (!char) {
    await setFlashMsg(c, "Character not found", "error")
    c.header("HX-Redirect", `/characters`)
    return c.body(null, 204)
  }

  const result = await learnSpell(getDb(c), char, body)

  if (!result.complete) {
    return c.html(<LearnSpellForm character={char} values={result.values} errors={result.errors} />)
  }

  const updatedChar = (await computeCharacter(getDb(c), characterId))!
  c.header("HX-Trigger", "closeEditModal")
  return c.html(<SpellsPanel character={updatedChar} swapOob={true} />)
})

characterRoutes.get("/characters/:id/edit/trait", async (c) => {
  const characterId = c.req.param("id") as string
  const char = await computeCharacter(getDb(c), characterId)
  if (!char) {
    await setFlashMsg(c, "Character not found", "error")
    c.header("HX-Redirect", `/characters`)
    return c.body(null, 204)
  }

  if (char.user_id !== c.var.user?.id) {
    await setFlashMsg(c, "You do not have permission to edit this character")
    c.header("HX-Redirect", `/characters`)
    return c.body(null, 403)
  }

  return c.html(<TraitEditForm character={char} />)
})

characterRoutes.post("/characters/:id/edit/trait", async (c) => {
  const characterId = c.req.param("id") as string
  const body = (await c.req.parseBody()) as Record<string, string>

  const char = await computeCharacter(getDb(c), characterId)
  if (!char) {
    await setFlashMsg(c, "Character not found", "error")
    c.header("HX-Redirect", `/characters`)
    return c.body(null, 204)
  }

  // Set source to "custom" for user-added traits
  body.source = "custom"
  body.character_id = characterId

  const result = await addTrait(getDb(c), body)

  if (!result.complete) {
    return c.html(<TraitEditForm character={char} values={result.values} errors={result.errors} />)
  }

  const updatedChar = (await computeCharacter(getDb(c), characterId))!
  c.header("HX-Trigger", "closeEditModal")
  return c.html(<TraitsPanel character={updatedChar} swapOob={true} />)
})

characterRoutes.get("/characters/:id/castspell", async (c) => {
  const characterId = c.req.param("id") as string
  const char = await computeCharacter(getDb(c), characterId)
  if (!char) {
    await setFlashMsg(c, "Character not found", "error")
    c.header("HX-Redirect", `/characters`)
    return c.body(null, 204)
  }

  if (char.user_id !== c.var.user?.id) {
    await setFlashMsg(c, "You do not have permission to edit this character")
    c.header("HX-Redirect", `/characters`)
    return c.body(null, 403)
  }

  const values: Record<string, string> = {}
  for (const qField of ["spell_id", "as_ritual"]) {
    const val = c.req.query(qField)
    if (val) {
      values[qField] = val
    }
  }

  return c.html(<CastSpellForm character={char} values={values} />)
})

characterRoutes.post("/characters/:id/castspell", async (c) => {
  const characterId = c.req.param("id") as string
  const char = await computeCharacter(getDb(c), characterId)
  if (!char) {
    await setFlashMsg(c, "Character not found", "error")
    c.header("HX-Redirect", `/characters`)
    return c.body(null, 204)
  }

  const body = (await c.req.parseBody()) as Record<string, string>
  const result = await castSpell(getDb(c), char, body)

  if (!result.complete) {
    return c.html(<CastSpellForm character={char} values={result.values} errors={result.errors} />)
  }

  const updatedChar = (await computeCharacter(getDb(c), characterId))!
  return c.html(
    <>
      <SpellCastResult message={result.note} spellId={result.spellId} />
      <SpellsPanel character={updatedChar} swapOob={true} />
      <CurrentStatus character={updatedChar} swapOob={true} />
    </>
  )
})

characterRoutes.post("/characters/:id/longrest", async (c) => {
  const characterId = c.req.param("id") as string
  const char = await computeCharacter(getDb(c), characterId)
  if (!char) {
    await setFlashMsg(c, "Character not found", "error")
    c.header("HX-Redirect", `/characters`)
    return c.body(null, 204)
  }

  // Parse with Zod
  const result = LongRestApiSchema.safeParse({
    character_id: characterId,
    note: null,
  })

  if (!result.success) {
    await setFlashMsg(c, "Failed to take long rest", "error")
    return c.html(<CurrentStatus character={char} />)
  }

  try {
    const summary = await longRest(
      getDb(c),
      result.data,
      char.currentHP,
      char.maxHitPoints,
      char.hitDice,
      char.availableHitDice,
      char.spellSlots,
      char.availableSpellSlots
    )

    // Build summary message
    const summaryParts: string[] = []
    if (summary.hpRestored > 0) summaryParts.push(`${summary.hpRestored} HP`)
    if (summary.hitDiceRestored > 0) summaryParts.push(`${summary.hitDiceRestored} hit dice`)
    if (summary.spellSlotsRestored > 0)
      summaryParts.push(`${summary.spellSlotsRestored} spell slots`)

    const message =
      summaryParts.length > 0
        ? `Long rest complete! Restored: ${summaryParts.join(", ")}`
        : "Long rest complete!"

    await setFlashMsg(c, message, "success")
  } catch (error) {
    logger.error("taking long rest", error as Error, { characterId: char.id })
    await setFlashMsg(c, "Failed to take long rest", "error")
    return c.html(<CurrentStatus character={char} />)
  }

  const updatedChar = (await computeCharacter(getDb(c), characterId))!
  return c.html(
    <>
      <CurrentStatus character={updatedChar} />
      <CharacterInfo character={updatedChar} swapOob={true} />
      <SpellsPanel character={updatedChar} swapOob={true} />
    </>
  )
})

characterRoutes.get("/characters/:id/edit/:field", async (c) => {
  const characterId = c.req.param("id") as string
  const field = c.req.param("field") as string

  const char = await computeCharacter(getDb(c), characterId)
  if (!char) {
    await setFlashMsg(c, "Character not found", "error")
    c.header("HX-Redirect", `/characters`)
    return c.body(null, 204)
  }

  if (char.user_id !== c.var.user?.id) {
    await setFlashMsg(c, "You do not have permission to edit this character")
    c.header("HX-Redirect", `/characters`)
    return c.body(null, 403)
  }

  if (field === "class") {
    return c.html(<ClassEditForm character={char} values={{}} />)
  }

  if (field === "hitpoints") {
    const defaultAction = char.currentHP >= char.maxHitPoints ? "lose" : "restore"
    const values = { action: defaultAction, amount: "" }
    return c.html(
      <HitPointsEditForm
        characterId={characterId}
        currentHP={char.currentHP}
        maxHitPoints={char.maxHitPoints}
        values={values}
      />
    )
  }

  if (field === "hitdice") {
    const defaultAction = char.availableHitDice.length < char.hitDice.length ? "restore" : "spend"
    const values = { action: defaultAction }
    return c.html(
      <HitDiceEditForm
        characterId={characterId}
        allHitDice={char.hitDice}
        availableHitDice={char.availableHitDice}
        values={values}
      />
    )
  }

  if (field === "spellslots") {
    return c.html(<SpellSlotsEditForm character={char} values={{}} />)
  }

  if (field === "prepspell") {
    // Parse query params
    const values: Record<string, string> = {}
    for (const qField of ["class", "spell_type", "current_spell_id", "spell_id"]) {
      const val = c.req.query(qField)
      if (val) {
        values[qField] = val
      }
    }

    return c.html(<PrepareSpellForm character={char} values={values} />)
  }

  if (field === "spellbook") {
    return c.html(<LearnSpellForm character={char} />)
  }

  if (field === "avatar") {
    return c.html(<UpdateAvatarForm character={char} />)
  }

  if (field === "abilities") {
    return c.html(<AbilitiesEditForm character={char} values={{}} />)
  }

  if (field === "skills") {
    return c.html(<SkillsEditForm character={char} values={{}} />)
  }

  return c.html(
    <ModalContent title={`${field} history`}>
      <div id="alert alert-info">Coming soon</div>
    </ModalContent>
  )
})

// POST /characters/:id/edit/abilities - Update all abilities
characterRoutes.post("/characters/:id/edit/abilities", async (c) => {
  const characterId = c.req.param("id") as string
  const char = await computeCharacter(getDb(c), characterId)
  if (!char) {
    await setFlashMsg(c, "Character not found", "error")
    c.header("HX-Redirect", `/characters`)
    return c.body(null, 204)
  }

  const body = (await c.req.parseBody()) as Record<string, string>
  const result = await updateAbilities(getDb(c), char, body)

  if (!result.complete) {
    return c.html(
      <AbilitiesEditForm character={char} values={result.values} errors={result.errors} />
    )
  }

  const updatedChar = (await computeCharacter(getDb(c), characterId))!
  c.header("HX-Trigger", "closeEditModal")
  return c.html(
    <>
      <AbilitiesPanel character={updatedChar} swapOob={true} />
      <CharacterInfo character={updatedChar} swapOob={true} />
      <SkillsPanel character={updatedChar} swapOob={true} />
      <SpellsPanel character={updatedChar} swapOob={true} />
    </>
  )
})

// POST /characters/:id/edit/skills - Update all skills
characterRoutes.post("/characters/:id/edit/skills", async (c) => {
  const characterId = c.req.param("id") as string
  const char = await computeCharacter(getDb(c), characterId)
  if (!char) {
    await setFlashMsg(c, "Character not found", "error")
    c.header("HX-Redirect", `/characters`)
    return c.body(null, 204)
  }

  const body = (await c.req.parseBody()) as Record<string, string>
  const result = await updateSkills(getDb(c), char, body)

  if (!result.complete) {
    return c.html(<SkillsEditForm character={char} values={result.values} errors={result.errors} />)
  }

  const updatedChar = (await computeCharacter(getDb(c), characterId))!
  c.header("HX-Trigger", "closeEditModal")
  return c.html(
    <>
      <SkillsPanel character={updatedChar} swapOob={true} />
      <CharacterInfo character={updatedChar} swapOob={true} />
    </>
  )
})

// POST /characters/:id/avatar - Set character avatar
characterRoutes.post("/characters/:id/avatar", async (c) => {
  const user = c.get("user")
  if (!user) {
    c.header("HX-Redirect", "/login")
    return c.body(null, 302)
  }

  const characterId = c.req.param("id")
  const body = (await c.req.parseBody()) as Record<string, string>

  const char = await computeCharacter(getDb(c), characterId)
  if (!char) {
    await setFlashMsg(c, "Character not found", "error")
    c.header("HX-Redirect", `/characters`)
    return c.body(null, 204)
  }

  const result = await updateAvatar(getDb(c), char, body)

  if (!result.complete) {
    return c.html(<UpdateAvatarForm character={char} errors={result.errors} />)
  }

  const updatedChar = (await computeCharacter(getDb(c), characterId))!
  c.header("HX-Trigger", "closeEditModal")
  return c.html(<CharacterInfo character={updatedChar} swapOob={true} />)
})

characterRoutes.get("/characters/:id/history/:field", async (c) => {
  const characterId = c.req.param("id") as string
  const field = c.req.param("field") as string

  if (field === "class") {
    const levels = await findByCharacterId(getDb(c), characterId)
    // Reverse to show most recent first
    levels.reverse()
    return c.html(<ClassHistory levels={levels} />)
  }

  if (field === "hitpoints") {
    // Fetch both HP changes and level-ups
    const hpChanges = await findHPChanges(getDb(c), characterId)
    const levels = await findByCharacterId(getDb(c), characterId)

    // Merge into unified events
    const events: HPHistoryEvent[] = []

    // Add HP delta events
    for (const hp of hpChanges) {
      events.push({
        date: hp.created_at,
        type: "delta",
        delta: hp.delta,
        note: hp.note || undefined,
      })
    }

    // Add level-up events (each grants max HP)
    for (const level of levels) {
      events.push({
        date: level.created_at,
        type: "level",
        class: level.class,
        level: level.level,
        hitDieRoll: level.hit_die_roll,
        note: level.note || undefined,
      })
    }

    // Sort by date descending (most recent first)
    events.sort((a, b) => b.date.getTime() - a.date.getTime())

    return c.html(<HitPointsHistory events={events} />)
  }

  if (field === "hitdice") {
    const hitDiceEvents = await findHitDiceChanges(getDb(c), characterId)
    // Reverse to show most recent first
    hitDiceEvents.reverse()
    return c.html(<HitDiceHistory events={hitDiceEvents} />)
  }

  if (field === "spellslots") {
    const spellSlotEvents = await findSpellSlotChanges(getDb(c), characterId)
    // Reverse to show most recent first
    spellSlotEvents.reverse()
    return c.html(<SpellSlotsHistory events={spellSlotEvents} />)
  }

  if (field === "prepared-spells") {
    const preparedSpellEvents = await findPreparedSpellChanges(getDb(c), characterId)
    // Reverse to show most recent first
    preparedSpellEvents.reverse()
    return c.html(<PreparedSpellsHistory events={preparedSpellEvents} />)
  }

  if (field === "spellbook") {
    const spellbookEvents = await findLearnedSpellChanges(getDb(c), characterId)
    // Reverse to show most recent first
    spellbookEvents.reverse()
    return c.html(<SpellbookHistory events={spellbookEvents} />)
  }

  if (field === "traits") {
    const traits = await findTraits(getDb(c), characterId)
    // Reverse to show most recent first
    traits.reverse()
    return c.html(<TraitHistory traits={traits} />)
  }

  if (field === "abilities") {
    const abilityEvents = await findAbilityChanges(getDb(c), characterId)
    // Reverse to show most recent first
    abilityEvents.reverse()
    return c.html(<AbilityHistory events={abilityEvents} />)
  }

  if (field === "skills") {
    const skillEvents = await findSkillChanges(getDb(c), characterId)
    // Reverse to show most recent first
    skillEvents.reverse()
    return c.html(<SkillsHistory events={skillEvents} />)
  }

  if (field === "notes") {
    const notes = await findNotes(getDb(c), characterId)
    return c.html(<NotesHistory characterId={characterId} notes={notes} />)
  }

  return c.html(
    <ModalContent title={`${field} history`}>
      <div id="alert alert-info">Coming soon</div>
    </ModalContent>
  )
})

// POST /characters/:id/notes - Auto-save notes
characterRoutes.post("/characters/:id/notes", async (c) => {
  const characterId = c.req.param("id") as string
  const user = c.var.user!

  const char = await computeCharacter(getDb(c), characterId)
  if (!char) {
    return c.html(<NotesSaveIndicator error={true} />)
  }

  if (char.user_id !== user.id) {
    return c.html(<NotesSaveIndicator error={true} />)
  }

  const body = (await c.req.parseBody()) as Record<string, string>
  const content = body.content || ""

  const result = await saveNotes(getDb(c), characterId, content)

  if (!result.complete) {
    return c.html(<NotesSaveIndicator error={true} />)
  }

  return c.html(<NotesSaveIndicator lastSaved={result.note.created_at} />)
})

// POST /characters/:id/notes/restore/:noteId - Restore a note version
characterRoutes.post("/characters/:id/notes/restore/:noteId", async (c) => {
  const characterId = c.req.param("id") as string
  const noteId = c.req.param("noteId") as string
  const user = c.var.user!

  const char = await computeCharacter(getDb(c), characterId)
  if (!char) {
    await setFlashMsg(c, "Character not found", "error")
    c.header("HX-Redirect", "/characters")
    return c.body(null, 204)
  }

  if (char.user_id !== user.id) {
    await setFlashMsg(c, "Unauthorized", "error")
    c.header("HX-Redirect", "/characters")
    return c.body(null, 403)
  }

  // Find the note to restore
  const noteToRestore = await findNoteById(getDb(c), noteId)
  if (!noteToRestore || noteToRestore.character_id !== characterId) {
    await setFlashMsg(c, "Note not found", "error")
    return c.html(<SessionNotes characterId={characterId} currentNote={null} />)
  }

  // Create new entry with restored content
  const restoredNote = await createNote(getDb(c), {
    character_id: characterId,
    content: noteToRestore.content,
    is_backup: false,
    restored_from_id: noteId,
  })

  c.header("HX-Trigger", "closeEditModal")
  return c.html(<SessionNotes characterId={characterId} currentNote={restoredNote} />)
})

export async function openQuickNote() {
  await open(true);
}

export async function openMyJournal() {
  await open(false);
}

async function open(quick) {
  const quickNotes = game.user.flags?.quickNotes;
  const journalUuid = quickNotes?.journalUuid;
  const journal = await fromUuid(journalUuid);
  if (!journal) {
    return await createQuickNotesJournal(quick);
  }

  if (quick) {
    const page = journal.pages.get(quickNotes?.mainPageId);
    if (page) {
      return page.sheet.render(true);
    }
    else {
      console.warn(game.i18n.localize("PQN.console.pageNotFound"));
      return ui.notifications.warn(game.i18n.localize("PQN.warn.pageNotFound"));
    }
  }
  await journal.sheet.render(true);
}

async function createQuickNotesJournal(quick) {
  const data = journalData();
  if (JournalEntry.canUserCreate(game.user)) {
    await createJournalAndMarkFlagsForUser(data, game.user);
    await open(quick);
  }
  else {
    const activeGM = game.users.activeGM;
    if (activeGM) {
      emitEvent("CREATE_JOURNAL", {
        journalData: data,
        gmUserId: activeGM.id,
        journalOwnerId: game.user.id,
        quick: quick
      });
    }
    else {
      ui.notifications.warn(game.i18n.localize("PQN.warn.noActiveGM"));
      return;
    }
  }
}

async function createJournalAndMarkFlagsForUser(data, user) {
  const folder = game.folders.find(f => f.name === "Quick Notes" && f.type === "JournalEntry");
  data.folder = folder || null;

  const journal = await JournalEntry.create(data);
  const mainPage = journal.pages.find(page => page);
  await user.update({["flags.quickNotes"]: {
    journalUuid: journal.uuid,
    mainPageId: mainPage?.id,
  }});
}

function journalData() {
  const user = game.user;
  return {
    name: `My Journal [${user.name}]`,
    ownership: {
      default: 0,
      [user.id]: 3
    },
    pages: [
      {
        name: "Quick Note",
        type: "text",
        text: {
          content: "",
          format: 1
        }
      }
    ]
  }
}

//===========================
//          SOCKET          =
//===========================
export function registerModuleSocket() {
  game.socket.on("module.pazindor-quick-notes", async (data) => {
    switch (data.type) {
      case "CREATE_JOURNAL":
        createJournalFor(data.payload);
        break;

      case "JOURNAL_CREATED":
        openJournalFor(data.payload);
        break;
    }
  });
}

function emitEvent(type, payload) {
  game.socket.emit('module.pazindor-quick-notes', {
    type: type,
    payload: payload
  });
}

async function createJournalFor(payload) {
  const { journalData, gmUserId, journalOwnerId, quick } = payload;
  if (game.user.id === gmUserId) {
    const owner = game.users.get(journalOwnerId);
    if (!owner) return;

    await createJournalAndMarkFlagsForUser(journalData, owner);
    emitEvent("JOURNAL_CREATED", {
      userId: journalOwnerId,
      quick: quick
    });
  }
}

function openJournalFor(payload) {
  const { userId, quick } = payload;
  if (game.user.id === userId) {
    open(quick);
  }
}
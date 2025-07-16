import { openMyJournal, openQuickNote, registerModuleSocket } from "./notes-manager.mjs";

// Hooks.once('init', () => registerGameSettings());
Hooks.on("ready", () => {
  createQuickNotesButtons();
  registerModuleSocket();
  if (game.user.isGM) createQuickNotesFolder();

  game.pazindorQuickNotes = {
    changeMyQuickNotePageId: (newId) => game.user.update({["flags.quickNotes.mainPageId"]: newId}),
  }
});

function createQuickNotesButtons() {
  const quickNotesWrapper = document.createElement('aside');
  quickNotesWrapper.id = "pazindor-quick-notes";
  quickNotesWrapper.classList.add("faded-ui");
  
  const menu = document.createElement('menu');
  menu.classList.add("flexcol");
  menu.setAttribute('data-tooltip-direction', 'RIGHT');
  menu.setAttribute('data-application-part', 'layers');
  menu.style.gap= "5px";

  menu.appendChild(_button("my-journal-button", "fa-book-open", game.i18n.localize("PQN.title.myJournal"), openMyJournal));
  menu.appendChild(_button("quick-note-button", "fa-notes", game.i18n.localize("PQN.title.quickNote"), openQuickNote));

  const ulLeftColumn = document.querySelector('#ui-left').querySelector('#ui-left-column-1');
  const players = ulLeftColumn.querySelector("#players");
  if (ulLeftColumn && players) {
    quickNotesWrapper.appendChild(menu);
    ulLeftColumn.insertBefore(quickNotesWrapper, players);
  }
}

function createQuickNotesFolder() {
  const exists = game.folders.find(f => f.name === "Quick Notes" && f.type === "JournalEntry");
  if (exists) return;

  Folder.create({
    name: "Quick Notes",
    type: "JournalEntry",
    color: "#611b00",
    sorting: "m"
  });
}

function _button(id, icon, title, func) {
  const button = document.createElement('button');
  button.id = id;
  button.classList.add(icon, "fa-solid", "quick-notes", "ui-control", "layer", "icon");
  button.setAttribute('aria-label', title);
  button.setAttribute('data-tooltip', '');
  button.addEventListener('click', () => func());

  const wrapper = document.createElement('li');
  wrapper.appendChild(button);
  return wrapper;
}
let xhr;
const form = document.getElementById("idInputForm");
const input = document.getElementById("idInput");
let backspaceTimer;
let lines, directions, stops;
const linesDropdown = document.getElementById("lines");
const directionsDropdown = document.getElementById("directions");
const stopsDropdown = document.getElementById("stops");
const dropdowns = [linesDropdown, directionsDropdown, stopsDropdown];
const busListElement = document.getElementById("busList");
const loader = document.getElementById("loader");

// init
init();

function init() {
  fetchJson("https://www.stcp.pt/pt/itinerarium/callservice.php?action=lineslist")
    .then(e => {
      lines = e.target.response.records;
      populateDropdown(linesDropdown, lines, "description");
    })
    .catch(() => {
      showErrorAlert();
    });

  form.addEventListener("submit", onSubmit);
  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);
  input.focus();
}

// navigation
function onKeyDown(event) {
  const focusedElement = document.activeElement;
  switch (event.key) {
    case "ArrowUp":
      if (input !== focusedElement) {
        getSelectedDropdown().dataset.selected = "false";
        input.focus();
      }
      break;
    case "ArrowDown":
      if (input === focusedElement) {
        input.blur();
        linesDropdown.dataset.selected = "true";
      }
      break;
    case "ArrowLeft":
      navigateDropdown(-1, focusedElement);
      break;
    case "ArrowRight":
      navigateDropdown(1, focusedElement);
      break;
    case "Enter":
      if (input !== focusedElement) getSelectedDropdown().focus();
      break;
    case "Backspace":
      backspaceTimer = setTimeout(() => {
        window.close();
      }, 750);
      break;
  }
}

function onKeyUp(event) {
  if (event.key === "Backspace" && backspaceTimer) {
    clearTimeout(backspaceTimer);
  }
}

// input
function onSubmit(event) {
  if (event) event.preventDefault();
  const id = input.value;
  if (!id) return;
  busListElement.innerHTML = "";
  loader.style.display = "block";

  fetchWidgetDocument(id)
    .then(e => {
      const busList = parseBusData(e.target.response);
      loader.style.display = "none";
      renderBusList(busList);
    })
    .catch(() => {
      showErrorAlert();
    });
}

// bus list
function renderBusList(busList) {
  busList.forEach(bus => {
    const entry = document.createElement("li");

    ["id", "destination", "status"].forEach(key => {
      const span = document.createElement("span");
      span.className = key;
      span.appendChild(document.createTextNode(bus[key]));
      entry.appendChild(span);
    });

    busListElement.appendChild(entry);
  });
}

// bus
function Bus(id, destination, status) {
  this.id = id;
  this.destination = destination;
  this.status = status;
}

function parseBusData(document) {
  const rows = document.querySelectorAll(".overview .separa");
  return Array.from(rows).map(row => {
    const id = row.querySelector(".Linha1").textContent.trim();
    const destination = fixString(row.querySelector(".Linha2").textContent.trim());
    const status = fixStatus(row.querySelector(".Linha4").textContent.trim());
    return new Bus(id, destination, status);
  });
}

function fixString(destination) {
  return destination
    .replace(/[-\s]+$/g, '')
    .toLowerCase()
    .replace(/(^\w|[-.\s]\w)/g, match => match.toUpperCase());
}

function fixStatus(status) {
  return status.startsWith("a") ? status.slice(0, -2) : status.split(" ")[2];
}

// dropdowns
function navigateDropdown(direction, focusedElement) {
  if (input === focusedElement) return;
  const selected = getSelectedDropdown();
  const next = dropdowns[dropdowns.indexOf(selected) + direction];
  if (next) {
    selected.dataset.selected = "false";
    next.dataset.selected = "true";
  }
}

function populateDropdown(dropdown, records, textField) {
  cleanDropdown(dropdown);
  records.forEach(record => {
    const option = document.createElement("option");
    option.textContent = record[textField];
    dropdown.appendChild(option);
  });

  const onChangeEvent = dropdown === linesDropdown ? onLineChange :
    dropdown === directionsDropdown ? onDirectionChange : onStopChange;
  dropdown.addEventListener("change", onChangeEvent);
}

function cleanDropdown(dropdown) {
  dropdown.innerHTML = "<option>---</option>";
}

function getSelectedDropdown() {
  return dropdowns.find(dropdown => dropdown.dataset.selected === "true");
}

// dropdown change events
function onLineChange() {
  cleanDropdown(directionsDropdown);
  cleanDropdown(stopsDropdown);
  const selectedLine = findSelected(lines, linesDropdown.value, "description");
  if (!selectedLine) return;

  fetchJson(`https://www.stcp.pt/pt/itinerarium/callservice.php?action=linedirslist&lcode=${selectedLine.code}`)
    .then(e => {
      directions = e.target.response.records;
      populateDropdown(directionsDropdown, directions, "descr_dir");
    })
    .catch(() => {
      showErrorAlert();
    });
}

function onDirectionChange() {
  cleanDropdown(stopsDropdown);
  const selectedLine = findSelected(lines, linesDropdown.value, "description");
  const selectedDirection = findSelected(directions, directionsDropdown.value, "descr_dir");
  if (!selectedLine || !selectedDirection) return;

  fetchJson(`https://www.stcp.pt/pt/itinerarium/callservice.php?action=linestops&lcode=${selectedLine.code}&ldir=${selectedDirection.dir}`)
    .then(e => {
      stops = e.target.response.records;
      populateDropdown(stopsDropdown, stops, "name");
    })
    .catch(() => {
      showErrorAlert();
    });
}

function onStopChange() {
  const selectedStop = findSelected(stops, stopsDropdown.value, "name");
  if (selectedStop) {
    input.value = selectedStop.code;
    onSubmit();
  }
}

function findSelected(records, value, key) {
  return records.find(record => record[key] === value);
}

// fetch
function fetchWithXhr(url, responseType) {
  return new Promise((resolve, reject) => {
    if (xhr) xhr.abort();
    xhr = new XMLHttpRequest({ mozSystem: true });
    xhr.open("GET", url);
    xhr.responseType = responseType;
    xhr.onload = resolve;
    xhr.onerror = reject;
    xhr.send();
  });
}

function fetchWidgetDocument(id) {
  return fetchWithXhr(`https://www.stcp.pt/pt/widget/post.php?uid=d72242190a22274321cacf9eadc7ec5f&np=&paragem=${id}&submete=Mostrar`, "document");
}

function fetchJson(url) {
  return fetchWithXhr(url, "json");
}

function showErrorAlert() {
  alert("Erro! Sem internet?");
}
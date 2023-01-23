import Counter from "./Counter.js";
const counter = new Counter();

const initApp = () => {
  const droparea = document.querySelector(".droparea");
  //highlights the border of the drop area when hover the file
  const active = () => droparea.classList.add("green-border");
  const inactive = () => droparea.classList.remove("green-border");

  const prevents = (e) => e.preventDefault();

  ["dragover", "drop"].forEach((evtName) => {
    droparea.addEventListener(evtName, prevents);
  });

  ["dragenter", "dragover"].forEach((evtName) => {
    droparea.addEventListener(evtName, active);
  });

  ["dragleave", "drop"].forEach((evtName) => {
    droparea.addEventListener(evtName, inactive);
  });

  droparea.addEventListener("drop", handleDrop);
};

document.addEventListener("DOMContentLoaded", initApp);

const handleDrop = (e) => {
  const dt = e.dataTransfer;
  const files = dt.files;
  const fileArray = [...files];
  if (fileArray.length > 20) return alert("Too many files!");
  handleFiles(fileArray);
};

const handleFiles = (fileArray) => {
  fileArray.forEach((file) => {
    //set a id for each file, in case the user drop a file with the same name
    const fileID = counter.getValue();
    counter.incrementValue();
    if (file.size / 1024 / 1024 > 4) return alert("File over 4MB");
    createResult(file, fileID);
    uploadFile(file, fileID);
  });
};

const createResult = (file, fileID) => {
  const origFileSizeString = getFileSizeString(file.size);

  const p1 = document.createElement("p");
  p1.className = "results__title";
  p1.textContent = file.name;

  const p2 = document.createElement("p");
  p2.id = `orig_size_${file.name}_${fileID}`;
  p2.className = "results__sizes";
  p2.textContent = origFileSizeString;

  const divOne = document.createElement("div");
  divOne.appendChild(p1);
  divOne.appendChild(p2);

  //progress bar
  const progress = document.createElement("p");
  progress.id = `progress_${file.name}_${fileID}`;
  progress.className = "results__bar";
  progress.max = 10;
  progress.value = 0;

  const p3 = document.createElement("p");
  p3.id = `new_size_${file.name}_${fileID}`;
  p3.className = "rests__size";

  const p4 = document.createElement("p");
  p4.id = `download_${file.name}_${fileID}`;
  p4.className = "results__download";

  const p5 = document.createElement("p");
  p5.id = `saved_${file.name}_${fileID}`;
  p5.className = "results__saved";

  const divDL = document.createElement("div");
  divDL.className = "divDL";
  divDL.appendChild(p4);
  divDL.appendChild(p5);

  const divTwo = document.createElement("div");
  divTwo.appendChild(p4);
  divTwo.appendChild(p5);

  const li = document.createElement("li");
  li.appendChild(divOne);
  li.appendChild(progress);
  li.appendChild(divTwo);

  document.querySelector(".results__list").appendChild(li);
  displayResults();
};

const getFileSizeString = (filesize) => {
  const sizeInKB = parseFloat(filesize) / 1024;
  const sizeInMB = parseFloat(filesize / 1024) / 1024;
  return sizeInKB > 1024
    ? `${sizeInMB.toFixed(1)}MB`
    : `${sizeInKB.toFixed(1)} KB`;
};

const displayResults = () => {
  const results = document.querySelector(".results");
  if (results.classList.contains("none")) {
    results.classList.remove("none");
    results.classList.add("block");
  }
};

const uploadFile = (file, filID) => {
  const reader = new FileReader();
  reader.addEventListener("loading", async (e) => {
    const filename = file.name;
    const base64String = e.target.result;
    const extension = filename.split(".").pop();
    const name = filename.slice(
      0,
      filename.origFileSizeString - (extension.length + 1)
    );
    const body = { base64String, name, extension };
    const url = "./.netlify/functions/compress+files";

    try {
      const filestream = await fetch(url, {
        method: "POST",
        body: JSON.stringify(body),
        isBase64Enconded: true,
      });
      imgJson = await filestream.json();
      if (imgJson.error) return handleFileerror(filename, fileID);
      updateProgressBar(file, fileID, imgJson);
    } catch (err) {
      console.log(err);
    }
  });
  reader.readAsDataURL(file);
};

const handleFileerror = (filename, fileID) => {
  const progress = document.getElementById(`progress_${filename}_${fileID}`);
  progress.value = 10;
  progress.classList.add("error");
};

const updateProgressBar = (file, fileID, imgJson) => {
  const progress = document.getElementById(`progress_${filename}_${fileID}`);
  const addProgress = setInterval(() => {
    progress.value += 1;
    if (progress.value === 10) {
      clearInterval(addProgress);
      progress.classList.add("finished");
      populateResult(file, fileID, imgJson);
    }
  }, 50);
};

const populateResult = (file, fileID, imgJson) => {
  const newFileSizeString = getFileSizeString(imgJson.filesize);
  const percentSaved = getPercentSaved(file.size, imgJson.filesize);

  const newSize = document.getElementById(`new_size_${file.name}_${fileID}`);
  newSize.textContent = newFileSizeString;

  const download = document.getElementById(`download_${file.name}_${fileID}`);
  const link = createDownloadLink(imgJson);
  download.appendChild(link);

  const saved = document.getElementById(`saved_${file.name}_${fileID}`);
  saved.textContent = `−${Math.round(percentSaved)}%`;
};

const getPercentSaved = (origFileSize, newFileSize) => {
  const origFS = parseFloat(origFileSize);
  const newFS = parseFloat(newFileSize);
  return ((origFS - newFS) / origFS) * 100;
};

const createDownloadLink = (imgJson) => {
  const extension = imgJson.filename.split(".").pop();
  const link = document.createElement("a");
  link.href = `data:image/${extension};base64,${imgJson.base64CompString}`;
  link.download = imgJson.filename;
  link.textContent = "download";
  return link;
};

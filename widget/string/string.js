
const getString = (key) => {
  return stringsKeys[key] || defaultValues[key];
};

const getLanguage = (key) => {
  return new Promise((resolve, reject) => {
    buildfire.language.get({ stringKey: key }, (err, res) => {
      if (err) {
        resolve(null);
      }
      stringsKeys[key] = res;
      resolve(res);
    });
  });
};

const initLanguageStrings = () => {
  return new Promise((resolve, reject) => {
    fetch("../resources/languages.json")
      .then((res) => res.json())
      .then((data) => {
        const sections = data.sections;
        for (const sectionKey in sections) {
          const labels = sections[sectionKey].labels;
          for (const labelKey in labels) {
            defaultStrings[`${sectionKey}.${labelKey}`] = labels[labelKey].defaultValue;
          }
        }
        const arr = Object.keys(stringsKeys).map((el) => getLanguage(el));
        return Promise.all(arr);
      })
      .then((values) => resolve(values))
      .catch((error) => {
        console.error("Error initializing language strings:", error);
        const arr = Object.keys(stringsKeys).map((el) => getLanguage(el));
        Promise.all(arr).then(resolve).catch(reject);
      });
  });
};

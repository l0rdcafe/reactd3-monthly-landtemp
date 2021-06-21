const getTemps = () => {
  return fetch(
    "https://raw.githubusercontent.com/FreeCodeCamp/ProjectReferenceData/master/global-temperature.json"
  ).then((res) => res.json());
};

export default getTemps

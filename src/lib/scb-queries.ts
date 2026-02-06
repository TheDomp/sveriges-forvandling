export const SCB_API_BASE = "https://api.scb.se/OV0104/v1/doris/sv/ssd";

// BE0101J: Flyttningar efter region, ålder och kön. År 1997 - 2024
export const BE0101J_QUERY = {
  query: [
    {
      code: "Region",
      selection: {
        filter: "all",
        values: ["*"]
      }
    },
    {
      code: "Kon",
      selection: {
        filter: "all",
        values: ["*"]
      }
    },
    {
      code: "Alder",
      selection: {
        filter: "item",
        values: ["tot"]
      }
    },
    {
      code: "ContentsCode",
      selection: {
        filter: "item",
        values: ["BE0101AZ", "BE0101AU", "BE0101AV"] // Netto, In, Ut
      }
    },
    {
      code: "Tid",
      selection: {
        filter: "all",
        values: ["*"]
      }
    }
  ],
  response: {
    format: "json"
  }
};

// HE0110: Disponibel inkomst för hushåll efter region, hushållstyp och ålder
export const HE0110_QUERY = {
  query: [
    {
      code: "Region",
      selection: {
        filter: "all",
        values: ["*"]
      }
    },
    {
      code: "Hushallstyp",
      selection: {
        filter: "item",
        values: ["E90"] // Samtliga hushåll
      }
    },
    {
      code: "Alder",
      selection: {
        filter: "item",
        values: ["18+"]
      }
    },
    {
      code: "ContentsCode",
      selection: {
        filter: "item",
        values: ["000006SY"] // Medianvärde, tkr
      }
    },
    {
      code: "Tid",
      selection: {
        filter: "all",
        values: ["*"]
      }
    }
  ],
  response: {
    format: "json"
  }
};

// UF0506: Befolkning 16-74 år efter region, utbildningsnivå, ålder och kön
export const UF0506_QUERY = {
  query: [
    {
      code: "Region",
      selection: {
        filter: "all",
        values: ["*"]
      }
    },
    {
      code: "UtbildningsNiva",
      selection: {
        filter: "item",
        values: ["5", "6", "7"] // Hämtar eftergymnasial utbildning
      }
    },
    {
      code: "Alder",
      selection: {
        filter: "item",
        values: ["tot16-74"]
      }
    },
    {
      code: "Kon",
      selection: {
        filter: "all",
        values: ["*"]
      }
    },
    {
      code: "ContentsCode",
      selection: {
        filter: "item",
        values: ["UF0506A1"] // Antal
      }
    },
    {
      code: "Tid",
      selection: {
        filter: "all",
        values: ["*"]
      }
    }
  ],
  response: {
    format: "json"
  }
};

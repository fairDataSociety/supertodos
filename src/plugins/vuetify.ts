import colors from "vuetify/lib/util/colors";

import Vue from "vue";
import Vuetify from "vuetify/lib";

Vue.use(Vuetify);

const theme = {
  primary: "#1e88e5", // change header color from here || "#1e88e6", "#21c1d6", "#fc4b6c", "#563dea", "#9C27b0", "#ff9800"
  info: "#1e88e5",
  success: "#21c1d6",
  accent: "#fc4b6c",
  default: "#563dea",
};

export default new Vuetify({
  icons: {
    iconfont: "mdi", // default - only for display purposes
  },
  theme: {
    themes: {
      dark: theme,
      light: theme,
    },
  },
});

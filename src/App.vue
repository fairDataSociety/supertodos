<template>
  <v-app>
    <v-data-table
      :headers="headers"
      :items="todos"
      sort-by="key"
      class="elevation-1"
    >
      <template v-slot:top>
        <v-toolbar flat>
          <v-toolbar-title>fairdrive todos</v-toolbar-title>
          <v-divider class="mx-4" inset vertical></v-divider>
          <v-spacer></v-spacer>
          <v-dialog v-model="loginDialog" max-width="500px">
            <template v-slot:activator="{ on, attrs }">
              <v-btn color="primary" dark class="m-2" v-bind="attrs" v-on="on">
                Login
              </v-btn>
            </template>
            <v-card>
              <v-card-title>
                <v-progress-circular
                  indeterminate
                  v-show="loginProgress"
                  color="primary"
                ></v-progress-circular>
                <span class="text-h5">Login to fairdrive</span>
              </v-card-title>

              <v-card-text>
                <v-container>
                  <v-row>
                    <v-col cols="12">
                      <v-text-field
                        v-model="credentials.username"
                        label="Username"
                      ></v-text-field>
                    </v-col>
                  </v-row>
                  <v-row>
                    <v-col cols="12">
                      <v-text-field
                        v-model="credentials.password"
                        :append-icon="show1 ? 'mdi-eye' : 'mdi-eye-off'"
                        :type="show1 ? 'text' : 'password'"
                        name="input-10-1"
                        label="Password"
                        hint="At least 8 characters"
                        counter
                        @click:append="show1 = !show1"
                      ></v-text-field>
                    </v-col>
                  </v-row>
                </v-container>
              </v-card-text>

              <v-card-actions>
                <v-btn color="blue darken-1" text @click="close">
                  Cancel
                </v-btn>
                <v-btn color="blue darken-1" text @click="login"> Login </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
          <v-dialog v-model="addDialog" max-width="500px">
            <template v-slot:activator="{ on, attrs }">
              <v-progress-circular
                indeterminate
                v-show="addProgress"
                color="primary"
              ></v-progress-circular>
              <v-btn color="primary" dark class="m-2" v-bind="attrs" v-on="on">
                New Todo
              </v-btn>
            </template>
            <v-card>
              <v-card-title>
                <span class="text-h5">{{ formTitle }}</span>
              </v-card-title>

              <v-card-text>
                <v-container>
                  <v-row>
                    <v-col cols="12" sm="6" md="4">
                      <v-text-field
                        v-model="editedItem.label"
                        label="Todo text"
                      ></v-text-field>
                    </v-col>
                  </v-row>
                </v-container>
              </v-card-text>

              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="blue darken-1" text @click="close">
                  Cancel
                </v-btn>
                <v-btn color="blue darken-1" text @click="save"> Save </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
          <v-dialog v-model="dialogDelete" max-width="500px">
            <v-card>
              <v-card-title class="text-h5"
                >Are you sure you want to delete this item?</v-card-title
              >
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="blue darken-1" text @click="closeDelete"
                  >Cancel</v-btn
                >
                <v-btn color="blue darken-1" text @click="deleteItemConfirm"
                  >OK</v-btn
                >
                <v-spacer></v-spacer>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </v-toolbar>
      </template>
      <!-- eslint-disable-next-line vue/valid-v-slot -->
      <template v-slot:item.actions="{ item }">
        <v-icon small class="mr-2" @click="editItem(item)"> mdi-pencil </v-icon>
        <v-icon small @click="deleteItem(item)"> mdi-delete </v-icon>
      </template>
      <template v-slot:no-data>
        <v-btn color="primary" @click="initialize"> Reset </v-btn>
      </template>
    </v-data-table>
  </v-app>
</template>
<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { FdpStorage } from "@fairdatasociety/fdp-storage";
import { v4 as uuidv4 } from "uuid";

export interface TodoItem {
  key: string;
  label: string;
  id: string;
}

const TODOS_NAMESPACE = "todos";
const TODOS_PATH = "items";

@Component({
  components: {},
  computed: {
    formTitle() {
      return this.editedIndex === -1 ? "New Item" : "Edit Item";
    },
  },

  watch: {
    dialog(val) {
      val || this.close();
    },
    dialogDelete(val) {
      val || this.closeDelete();
    },
  },
})
export default class App extends Vue {
  loginDialog = false;
  addDialog = false;
  show1 = false;

  dialogDelete = false;
  credentials = {
    username: "",
    password: "",
  };
  headers = [
    {
      text: "todo",
      align: "start",
      sortable: false,
      value: "label",
    },
    { text: "Actions", value: "actions", sortable: false },
  ];
  todos: any[] = [];
  editedIndex = -1;
  editedItem: TodoItem = {
    key: "",
    label: "",
    id: "",
  };
  defaultItem: TodoItem = {
    key: "",
    label: "",
    id: "",
  };
  loginProgress = false;
  fdp: FdpStorage;
  wallet: any;
  podCounter: number;
  todoPod: any;

  created() {
    this.initialize();
  }
  async initialize() {
    // this.todos = [
    //   {
    //     key: "1",
    //     label: "default todo item",
    //     id: "1",
    //   },
    // ];
    const rpcUrl = `https://goerli.infura.io/v3/92ed13edfad140409ac24457a9c4e22d`;

    const publicResolver = `0x200C9d891F5b480D6210a252539c473e3Ae4771a`;
    const ensRegistry = `0xE687f17858382C6FCbAe02b31B0aAB607D396059`;
    const fdsRegistrar = `0x3adfB0D6B9662c9F711c2Ab18Cf5D7B0cc369C6B`;

    this.fdp = new FdpStorage(
      "http://localhost:1633",
      "http://localhost:1635",
      {
        ensOptions: {
          performChecks: true,
          rpcUrl,
          contractAddresses: {
            ensRegistry,
            publicResolver,
            fdsRegistrar,
          },
        },
        ensDomain: "fds",
      }
    );
  }

  async loadItems() {
    const items = await this.fdp.directory.read(
      TODOS_NAMESPACE,
      `/${TODOS_PATH}`
    );

    for (const i in items.content) {
      const data = await this.fdp.file.downloadData(
        TODOS_NAMESPACE,
        `/${TODOS_PATH}/${(i as any).name}`
      );
      const obj = JSON.parse(data.text());
      this.todos.push(obj);
    }
  }

  editItem(item: TodoItem) {
    this.editedIndex = this.todos.indexOf(item);
    this.editedItem = Object.assign({}, item);
    this.addDialog = true;
  }

  async deleteItem(item: TodoItem) {
    await this.fdp.file.delete(TODOS_NAMESPACE, `/${TODOS_PATH}/${item.id}`);
    this.editedIndex = this.todos.indexOf(item);
    this.editedItem = Object.assign({}, item);
    this.dialogDelete = true;
  }

  deleteItemConfirm() {
    this.todos.splice(this.editedIndex, 1);
    this.closeDelete();
  }

  close() {
    this.loginDialog = this.addDialog = false;
    this.$nextTick(() => {
      this.editedItem = Object.assign({}, this.defaultItem);
      this.editedIndex = -1;
    });
  }

  closeDelete() {
    this.dialogDelete = false;
    this.$nextTick(() => {
      this.editedItem = Object.assign({}, this.defaultItem);
      this.editedIndex = -1;
    });
  }

  async save() {
    if (this.editedIndex > -1) {
      Object.assign(this.todos[this.editedIndex], this.editedItem);
    } else {
      this.todos.push(this.editedItem);
    }
    const id = uuidv4();
    await this.fdp.file.uploadData(
      TODOS_NAMESPACE,
      `/${TODOS_PATH}/${id}`,
      JSON.stringify({ todo: this.editedItem.label, id })
    );
    this.close();
  }

  async login() {
    try {
      this.loginProgress = true;
      const res = await this.fdp.account.login(
        this.credentials.username,
        this.credentials.password
      );
      this.wallet = res;

      // check if there is any pod, else create a new one

      let pods = await this.fdp.personalStorage.list();
      if (pods.length < 1) {
        await this.fdp.personalStorage.create(TODOS_NAMESPACE);
      }

      const exists = await this.fdp.directory.read(
        TODOS_NAMESPACE,
        `/${TODOS_PATH}`
      );

      if (!exists) {
        await this.fdp.directory.create(TODOS_NAMESPACE, `/${TODOS_PATH}`);
      }

      await this.loadItems();
    } catch (e) {
      alert(e.message);
    }
    this.loginProgress = false;
    this.loginDialog = false;
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>

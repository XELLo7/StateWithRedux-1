import { configureStore, createSlice, nanoid } from "@reduxjs/toolkit";
import * as Device from "expo-device"; // Native module via Expo
import * as Haptics from "expo-haptics"; // Native module via Expo
import { useMemo, useState } from "react";
import { FlatList, Platform, SafeAreaView, ScrollView, StyleSheet, useWindowDimensions, View, } from "react-native";
import { Appbar, Avatar, Button, Card, MD3DarkTheme, MD3LightTheme, Provider as PaperProvider, Snackbar, Switch, Text, TextInput } from "react-native-paper";
import { Provider as ReduxProvider, useDispatch, useSelector } from "react-redux";

/********************
 * Managing State with Redux
 ********************/

const uiSlice = createSlice({
  name: "ui",
  initialState: { darkMode: false, showBanner: true },
  reducers: {
    toggleDarkMode(state) {
      state.darkMode = !state.darkMode;
    },
    dismissBanner(state) {
      state.showBanner = false;
    },
  },
});

const todosSlice = createSlice({
  name: "todos",
  initialState: { items: [] },
  reducers: {
    addTodo: {
      reducer(state, action) {
        state.items.unshift(action.payload);
      },
      prepare(title) {
        return {
          payload: { id: nanoid(), title, done: false, createdAt: Date.now() },
        };
      },
    },
    toggleTodo(state, action) {
      const t = state.items.find((x) => x.id === action.payload);
      if (t) t.done = !t.done;
    },
    removeTodo(state, action) {
      state.items = state.items.filter((x) => x.id !== action.payload);
    },
    clearTodos(state) {
      state.items = [];
    },
    clearPending(state) {
      state.items = state.items.filter((item) => item.done);
    },
    clearCompleted(state) {
      state.items = state.items.filter((item) => !item.done);
    },
  },
});

const { toggleDarkMode } = uiSlice.actions;
const { addTodo, toggleTodo, removeTodo, clearPending, clearCompleted } = todosSlice.actions;

const store = configureStore({
  reducer: {
    ui: uiSlice.reducer,
    todos: todosSlice.reducer,
  },
});

/********************
 * App Root
 ********************/

export default function App() {
  return (
    <ReduxProvider store={store}>
      <ThemedApp />
    </ReduxProvider>
  );
}

function ThemedApp() {
  const darkMode = useSelector((s) => s.ui.darkMode);
  const theme = useMemo(() => (darkMode ? MD3DarkTheme : MD3LightTheme), [darkMode]);
  return (
    <PaperProvider theme={theme}>
      <SafeAreaView style={{ flex: 1 }}>
        <AppScaffold />
      </SafeAreaView>
    </PaperProvider>
  );
}

/********************
 * User Interface Design
 ********************/

function AppScaffold() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  // Snackbar state
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // Expose a handler to toggle tasks and show snackbar
  const dispatch = useDispatch();

  // Handler to toggle todo and show snackbar message
  const handleToggle = (id, done) => {
    dispatch(toggleTodo(id));
    setSnackbarMessage(done ? "Task marked undone" : "Task done");
    setSnackbarVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View style={[styles.container, isTablet && styles.containerTablet]}>
      <Appbar.Header>
        <Appbar.Content
          title="Expo + Redux Demo"
          subtitle={`Running on ${Device.osName ?? "Unknown OS"}`}
        />
        <DarkModeSwitch />
      </Appbar.Header>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[isTablet && styles.contentTablet, { paddingBottom: 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.column, isTablet && styles.columnTablet]}>
          <TodosCard />

          {/* Separate box for Pending Tasks */}
          <View style={styles.taskBox}>
            <PendingTasksCard onToggle={handleToggle} />
          </View>

          {/* Separate box for Completed Tasks */}
          <View style={styles.taskBox}>
            <CompletedTasksCard onToggle={handleToggle} />
          </View>
        </View>
      </ScrollView>

      <Appbar style={styles.footer}>
        <Appbar.Action icon="github" accessibilityLabel="GitHub" onPress={() => {}} />
        <Appbar.Content
          title="Footer"
          subtitle={Platform.select({ ios: "iOS", android: "Android", default: "Web" })}
        />
      </Appbar>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={{ backgroundColor: "#6200ee" }} // Using primary color from material theme
        action={{
          label: "Close",
          onPress: () => setSnackbarVisible(false),
          textColor: "white",
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}

function DarkModeSwitch() {
  const dispatch = useDispatch();
  const darkMode = useSelector((s) => s.ui.darkMode);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingRight: 12 }}>
      <Text accessibilityRole="header" style={{ marginRight: 8 }}>
        {darkMode ? "Dark" : "Light"}
      </Text>
      <Switch
        value={darkMode}
        onValueChange={() => dispatch(toggleDarkMode())}
        accessibilityLabel="Toggle dark mode"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      />
    </View>
  );
}

/********************
 * Todos Card
 ********************/

function TodosCard() {
  const dispatch = useDispatch();
  const [title, setTitle] = useState("");

  const handleAdd = () => {
    if (!title.trim()) return;
    dispatch(addTodo(title.trim()));
    setTitle("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <Card style={styles.card}>
      <Card.Title
        title="Todos (Redux list)"
        subtitle="Add new tasks below"
        left={(props) => <Avatar.Icon {...props} icon="check-circle-outline" />}
      />
      <Card.Content>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TextInput
            style={{ flex: 1, marginRight: 8 }}
            label="What needs doing?"
            value={title}
            onChangeText={setTitle}
            onSubmitEditing={handleAdd}
            returnKeyType="done"
          />
          <Button
            mode="contained"
            style={{ height: 56, justifyContent: "center" }}
            onPress={handleAdd}
          >
            Add
          </Button>
        </View>
      </Card.Content>
    </Card>
  );
}

/********************
 * Pending Tasks Card
 ********************/

function PendingTasksCard({ onToggle }) {
  const dispatch = useDispatch();
  const pendingItems = useSelector((s) => s.todos.items.filter((item) => !item.done));
  const { width } = useWindowDimensions();
  const numColumns = width >= 900 ? 2 : 1;

  if (pendingItems.length === 0)
    return <Text style={styles.emptyMessage}>No pending tasks</Text>;

  return (
    <>
      <View style={styles.headerRow}>
        <Text style={styles.taskSectionTitle}>Pending Tasks</Text>
        <Button
          mode="outlined"
          compact
          onPress={() => dispatch(clearPending())}
          accessibilityLabel="Clear all pending tasks"
        >
          Clear All
        </Button>
      </View>
      <FlatList
        data={pendingItems}
        key={numColumns}
        numColumns={numColumns}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 8, paddingBottom: 8 }}
        renderItem={({ item }) => (
          <Card style={[styles.taskItem, { marginRight: numColumns > 1 ? 8 : 0 }]}>
            <Card.Title
              title={item.title}
              subtitle={new Date(item.createdAt).toLocaleString()}
              left={(props) => <Avatar.Icon {...props} icon="clock-outline" />}
            />
            <Card.Actions>
              <Button onPress={() => onToggle(item.id, item.done)}>Done</Button>
              <Button
                onPress={() => dispatch(removeTodo(item.id))}
                buttonColor="red"
                textColor="white"
                accessibilityLabel={`Remove task ${item.title}`}
              >
                Remove
              </Button>
            </Card.Actions>
          </Card>
        )}
      />
    </>
  );
}

/********************
 * Completed Tasks Card
 ********************/

function CompletedTasksCard({ onToggle }) {
  const dispatch = useDispatch();
  const completedItems = useSelector((s) => s.todos.items.filter((item) => item.done));
  const { width } = useWindowDimensions();
  const numColumns = width >= 900 ? 2 : 1;

  if (completedItems.length === 0)
    return <Text style={styles.emptyMessage}>No completed tasks</Text>;

  return (
    <>
      <View style={styles.headerRow}>
        <Text style={styles.taskSectionTitle}>Completed Tasks</Text>
        <Button
          mode="outlined"
          compact
          onPress={() => dispatch(clearCompleted())}
          accessibilityLabel="Clear all completed tasks"
        >
          Clear All
        </Button>
      </View>
      <FlatList
        data={completedItems}
        key={numColumns}
        numColumns={numColumns}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 8, paddingBottom: 8 }}
        renderItem={({ item }) => (
          <Card style={[styles.taskItem, { marginRight: numColumns > 1 ? 8 : 0 }]}>
            <Card.Title
              title={item.title}
              subtitle={new Date(item.createdAt).toLocaleString()}
              left={(props) => <Avatar.Icon {...props} icon="check" />}
            />
            <Card.Actions>
              <Button onPress={() => onToggle(item.id, item.done)}>Undone</Button>
              <Button
                onPress={() => dispatch(removeTodo(item.id))}
                buttonColor="red"
                textColor="white"
                accessibilityLabel={`Remove completed task ${item.title}`}
              >
                Remove
              </Button>
            </Card.Actions>
          </Card>
        )}
      />
    </>
  );
}

/**********************
 * Styles
 ********************/

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },
  containerTablet: { paddingHorizontal: 12 },
  content: { flex: 1, padding: 12 },
  contentTablet: { flexDirection: "row", gap: 12 },
  column: { flex: 1 },
  columnTablet: { flex: 1 },

  card: { marginBottom: 12, borderRadius: 16, overflow: "hidden" },
  footer: { justifyContent: "center" },

  taskBox: {
    marginVertical: 12,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "white",

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,

    elevation: 3,
    padding: 12,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  taskSectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 4,
  },

  taskItem: {
    flex: 1,
    marginBottom: 8,
    borderRadius: 12,
    overflow: "hidden",
  },

  emptyMessage: {
    fontSize: 16,
    color: "#666",
    fontStyle: "italic",
    marginLeft: 8,
  },
});

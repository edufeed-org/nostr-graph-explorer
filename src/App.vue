<template>
  <v-app>
    <v-app-bar color="primary" prominent>
      <v-app-bar-nav-icon variant="text" @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
      
      <v-toolbar-title>Nostr Graph Explorer</v-toolbar-title>

      <v-spacer></v-spacer>

      <v-btn icon>
        <v-icon>mdi-magnify</v-icon>
      </v-btn>
    </v-app-bar>

    <v-navigation-drawer v-model="drawer" temporary>
      <v-list>
        <v-list-item prepend-icon="mdi-graph" title="Graph View" value="graph"></v-list-item>
        <v-list-item prepend-icon="mdi-filter" title="Filters" value="filters"></v-list-item>
        <v-list-item prepend-icon="mdi-note-text" title="My Notes" value="notes"></v-list-item>
        <v-list-item prepend-icon="mdi-cog" title="Settings" value="settings"></v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <GraphView />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import GraphView from './components/GraphView.vue';

const drawer = ref(false);
</script>

<style scoped>
/* App-level styles */
</style>

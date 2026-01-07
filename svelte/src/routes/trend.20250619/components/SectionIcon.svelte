<script lang="ts">
import { Clock, MessageCircle, Utensils, TrendingUp } from 'lucide-svelte';
  interface Props {
    type: string;
  }

  let { type }: Props = $props();
</script>

{#if type === 'trending'}
  <span class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-r from-orange-400 to-pink-400">
    <TrendingUp class="w-4 h-4 text-white" />
  </span>
{:else if type === 'time'}
  <span class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-r from-blue-400 to-purple-400">
    <Clock class="w-4 h-4 text-white" />
  </span>
{:else if type === 'review'}
  <span class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-r from-green-400 to-blue-400">
    <MessageCircle class="w-4 h-4 text-white" />
  </span>
{:else}
  <span class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-r from-purple-400 to-pink-400">
    <Utensils class="w-4 h-4 text-white" />
  </span>
{/if} 
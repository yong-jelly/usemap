<script lang="ts">
  import { onMount } from 'svelte';
  import type { SvelteComponent } from 'svelte';

  let {
    name,
    size = 24,
    class: className,
    ...rest
  } = $props<{
    name: string;
    size?: number;
    class?: string;
    [key: string]: any;
  }>();

  let icon: any = $state(null);

  onMount(async () => {
    try {
      const icons = await import('lucide-svelte/icons');
      const iconName = name
        .split('-')
        .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
        .join('');
      
      if (iconName in icons) {
        icon = icons[iconName as keyof typeof icons];
      } else {
        console.warn(`Icon "${name}" not found`);
      }
    } catch (e) {
      console.error(e);
    }
  });
</script>

{#if icon}
  {@const SvelteComponent_1 = icon}
  <SvelteComponent_1 size={size} class={className} {...rest} />
{/if} 
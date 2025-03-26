// pages/index.js
import React from 'react';

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="p-6 border-b border-border">
        <h1 className="text-4xl font-bold">Next.js Theme Demo</h1>
        <p className="mt-2 text-secondary-foreground">
          A demonstration of our modern, sleek, minimalistic color palette.
        </p>
      </header>

      <main className="p-6 grid gap-8">
        {/* Card Section */}
        <section className="p-6 bg-card text-card-foreground rounded-lg shadow">
          <h2 className="text-2xl font-semibold">Card Component</h2>
          <p>This card uses the card background and foreground colors.</p>
        </section>

        {/* Popover Section */}
        <section className="p-6 bg-popover text-popover-foreground rounded-lg shadow">
          <h2 className="text-2xl font-semibold">Popover Component</h2>
          <p>This section demonstrates the popover background and text colors.</p>
        </section>

        {/* Primary, Secondary, Muted, Accent */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-primary text-primary-foreground rounded-lg">
            <h3 className="font-semibold">Primary</h3>
            <p>Primary colors for strong call-to-action elements.</p>
          </div>
          <div className="p-6 bg-secondary text-secondary-foreground rounded-lg">
            <h3 className="font-semibold">Secondary</h3>
            <p>Secondary colors for subtle emphasis.</p>
          </div>
          <div className="p-6 bg-muted text-muted-foreground rounded-lg">
            <h3 className="font-semibold">Muted</h3>
            <p>Muted colors for less prominent elements.</p>
          </div>
          <div className="p-6 bg-accent text-accent-foreground rounded-lg">
            <h3 className="font-semibold">Accent</h3>
            <p>Accent colors to highlight key areas.</p>
          </div>
        </section>

        {/* Destructive Section */}
        <section className="p-6 bg-destructive text-white rounded-lg">
          <h2 className="text-2xl font-semibold">Destructive Action</h2>
          <p>This area demonstrates the destructive color, useful for warnings or errors.</p>
        </section>

        {/* Chart Colors Demo */}
        <section className="flex flex-wrap gap-4">
          <div className="p-4 bg-chart-1 text-foreground rounded-md">
            <p>Chart 1</p>
          </div>
          <div className="p-4 bg-chart-2 text-foreground rounded-md">
            <p>Chart 2</p>
          </div>
          <div className="p-4 bg-chart-3 text-foreground rounded-md">
            <p>Chart 3</p>
          </div>
          <div className="p-4 bg-chart-4 text-foreground rounded-md">
            <p>Chart 4</p>
          </div>
          <div className="p-4 bg-chart-5 text-foreground rounded-md">
            <p>Chart 5</p>
          </div>
        </section>

        {/* Sidebar Simulation */}
        <aside className="p-6 bg-sidebar text-sidebar-foreground rounded-lg border border-sidebar-border">
          <h2 className="text-xl font-semibold">Sidebar</h2>
          <p>This sidebar uses the sidebar background and text colors.</p>
          <div className="mt-4 p-3 bg-sidebar-primary text-sidebar-primary-foreground rounded">
            Sidebar Primary
          </div>
          <div className="mt-4 p-3 bg-sidebar-accent text-sidebar-accent-foreground rounded">
            Sidebar Accent
          </div>
        </aside>
      </main>

      <footer className="p-4 border-t border-border text-sm text-muted-foreground text-center">
        © {new Date().getFullYear()} Next.js Theme Demo
      </footer>
    </div>
  );
}

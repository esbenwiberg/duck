# Activity Feed

## Goal
Give users a real-time view of everything happening in their workspace — who did what and when —
so they can stay in sync without relying on notifications or asking colleagues.

## Users
All authenticated users can see the feed. Administrators can see activity across all users;
standard users see only their own workspace activity.

## What it does
The Activity Feed is a chronological list of events scoped to the current user's workspace.
Each entry shows the actor, the action taken, the affected resource, and a timestamp.
Entries are grouped by day. The feed auto-refreshes every 30 seconds.

Users can:
- Filter by event type (created, updated, deleted, shared)
- Filter by team member (administrators only)
- Search by resource name
- Click any entry to navigate directly to the affected resource

The feed retains 90 days of history. Older entries are archived and not shown by default.

## Navigation
Settings → Workspace → Activity Feed

## Key constraints
- Feed is read-only; no actions can be taken from it beyond navigation
- Deleted resources still appear in the feed but the link is disabled
- The per-member filter is hidden for non-administrator roles

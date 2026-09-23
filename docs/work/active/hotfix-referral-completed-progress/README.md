# Referral completed progress hotfix

Unticketed production hotfix requested by Adrian on 2026-09-23. A completed referral usage is terminal, but its percentage is recalculated from the programme's current requirements. Adding a pathway after completion can display Completed alongside 33.33% and unfinished pathway tasks.

The hotfix starts from the production-aligned `current` branch. Review and release to `current` first; bring the same fix back into `master` after release. See [feature.md](feature.md) for scope and tests.

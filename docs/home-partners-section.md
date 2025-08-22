## Home Partners Section

### What was added
- A new `Partners` section at the top of the home page, positioned directly below the `Hero` and above `FeaturedCategories`.
- Component file: `components/home/partners.tsx`.
- Import and usage added to `app/page.tsx`.

### Style & UX
- Matches the home page spacing and typography: `py-16`, `max-w-[1400px]`, `px-4`, and a serif `h2` at `text-4xl`.
- Responsive grid of partner tiles using `grid-cols-2` up to `lg:grid-cols-6`.
- Minimalistic tile style with subtle hover emphasis to remain consistent with existing sections.

### Content
- Uses a static list of well-known art partners as placeholders.
- Update the `partners` array in `components/home/partners.tsx` to manage names or replace with logos in the future.

### Future Enhancements
- Swap text names for partner logo images via locally hosted assets or a CMS.
- Add links to partner profiles or external sites.
- Optional marquee/auto-scroll for larger partner lists.



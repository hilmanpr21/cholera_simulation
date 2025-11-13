## Steps making simulation 5:

-   Creating community, water body, and agents

    1.  Define community position (array)
        -   `communitiesPositions` — array of community coordinates `{ x, y }`.
    2.  Defince waterbodies array by mapping each community position
        -   `waterbodies` — one waterbody per community, created from `communitiesPositions`. Each waterbody holds contamination state and an id.
    3.  Create agent array
        -   `agents` — flattened array of all agent objects, each linked to a community by `communityId`.

-   Time manager

# TO learn:

-   How request animationID work and animation work
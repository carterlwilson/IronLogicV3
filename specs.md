I'd like to create an application that will allow gym owners to manage their clients, gym location info, coaches, schedules and workout programming. I'll start with some high level explanations here, then cover specific technical callouts, and then dig into specific workflows.

1. Overview

This app is going to be built for a very specific type of gym. This is a gym that may have multiple locations, but each location operates the same way. There is no unstructured time; clients go in at a specific time at a specific location to take a class with one of the coaches. The actual content of these classes is determined by a workout program created by a gym owner or coach. A workout program is structured as follows:
    1. Block (can be multiple blocks)
        1.1. Week (can be any number of weeks)
            1.1.1. Day ( can be 1-7 days )
                1.1.1.1. Activity (can be any number of activities)
                    - for most days, the clients will be performing weight lifting activities with specified numbers of sets and repetitions that are specific to that day. The weights they use are also specific to that day and are calculated using a percentage (once again specific to that day in the workout program) of their benchmark for that given lifting activity. They can also be assigned conditioning activities that are time-based or rep-based that may not be lifts. For example, a 60 second sprint, or a session of 100 kb swings
                    - Occasionally, the coaches will want to run a diagnostic day: on these days they will want to test clients to get new benchmark weights, times, or reps for a given activity


2. Technical callouts
    - Our data persistence will need to be done with mongoDB
    - I'd like this to be three separate applications: a server app, a client app, and a mobile app
    - The server should be an express server.
    - The client app is the only app that will ever use the server, and they will likely be deployed on same cloud host, so they can use the same domain
    - The client app should be a next.js app written in typescript
    - The mobile app should be a PWA
    - I have no interest in using tailwind.css for this, I have yet to see you implement that successfully. I'd like to use an established UI library (there will be a definite need for date picking, and object drag and drop as well).
    - Auth will be required for this application. I'd like for most of the auth to handled on the express server, with modern session management using JWT tokens.
    - On a given page when a user performs some kind of update to the persistence, we shouldn't have to completely reload page, changes should be shown immediately with optimistic loading and let error handlers deal with issues that may come up
    - A good benchmark for the server is the ability to handle around ~1000 simultaneous requests. This shouldn't be an issue for an express server, but bear it in mind. 

3. General Concepts
    3.1. Workout Program
        - a workout program in this contexts consists of:
        - Block (can be multiple blocks)
            - Week (can be any number of weeks)
                - Day ( can be 1-7 days )
                    - Activity (can be any number of activities)
                        - for most days, the clients will be performing weight lifting activities with specified numbers of sets and repetitions that are specific to that day. The weights they use are also specific to that day and are calculated using a percentage (once again specific to that day in the workout program) of their benchmark for that given lifting activity. They can also be assigned conditioning activities that are time-based or rep-based that may not be lifts. For example, a 60 second sprint, or a session of 100 kb swings
                        - Occasionally, the coaches will want to run a diagnostic day: on these days they will want to test clients to get new benchmark weights, times, or reps for a given activity
        - The activities need to be assignable to activity groups. i.e., a "incline bench press" and "decline bench press" activity could both go inside a "bench press" group
        - In a program, a user needs to be able to set block-scoped and week-scoped targets for the volume of reps of activities from a given group. This is expressed as a percentage of the total reps of all activity groups. ex., a user would set a target of 50% for the "bench press" group, meaning out of all the reps for all activities across the given week or block, 50% of those reps should be of activities in the "bench press" group.
        - We need to be able to track which block and week in the program the clients are currently on. This can be done at a program-scope level
    
    3.2. Workout Program Builder
        - The Desing for the actual program builder page is very important, and complex. Here are some considerations
            - It needs to be a clean, uncluttered interface
            - As users are creating the aforementioned volume targets and adding activities, they need to be able to see the actual percentage of activities for that target group out of total activities so that they can tailor their programs to either meet or exceed those targets.
            - Every layer of the program in the builder needs to be able to be copied and pasted. One of the problems gym owners have that we're trying to solve is excessive data entry when building programs
            - within a day, the user should be able to re-order the activites within the day via a drag and drop interface

    3.3. Weekly Schedules
        - The app needs to be able to track a weekly schedule for a gym. This schedule should have 7 days m-s, and each day should have timeslots. A coach, clients, and location can be assigned to those timeslots. Each timeslot should have a limit to how many clients can be in it.
        - The gym owner and coaches have a reasonable idea of when clients will be attending classes most weeks; but we want to leave flexibility for clients to change classes as needed. So, we need to let the owner and coaches create a base schedule that they know is reasonably accurate, and an active schedule for the week that uses that base schedule as a starting point.

    3.4. Benchmarks
        - Benchmarks represent how much weight a client can lift, how fast they can finish, or how many reps they can do for a given activity in a diagnostic test. 
        - An owner or coach will create benchmark templates. These will have a name, type, notes, and tags. The tags are an important feature that should be constant across the app. In the UI, the user will use these tags in various places to filter and sort benchmark templates.
        - A client should have as part of their data model a list of Benchmarks specific to them. These are based off the benchmark templates, so they should have all the template data plus whatever weight, time, or reps the client has achieved for that benchmark. 
        - We also want to be able to keep client-specific historical data for these benchmarks

4. Workflow for client app
    - Starting from the top, a user will need to be able to either log in or create an account. When a user logs in, their workflow will depend on what type of user they are. There are 4 different types of users:
        - Admin: should be able to do everything
        - Gym Owner: should be able to manage everything except users
        - Coach: should be able to manage everything except users
        - Client: Should have write access to their own data, and weekly schedules, and read access for workout programs

    3.1. When an admin logs in, they should see a dashboard showing cards with data about each gym including owner info, coach count, and client count. They should be able to use a collapsible nav menu to navigate to a users page, a gyms page, a programs page, a activities page, and a schedules page
        3.1.1. Users Page
            - Here an admin needs to be able to view, edit, add, and delete users. they need to be able to see their email, name, user type, and gym name for the gym they belong to. They also need to be able to reset the password for the user manually and send a password reset email to the user.
            - when adding any non-admin type user, the admin needs to be able to specify what gym the user will belong to
            - when adding a client-type user, a corresponding "client" should be created (users and clients should be separate entities becuase clients will have additional information added to them, but there should be a 1-to-1 referential relationship between client-type users and clients)
        3.1.2. Gyms Page
            - An admin needs to be able view, edit, add, and gyms. Important gym info is name, address, phone number, owner (when assigning a new owner they need to be able select from existing owner type users), coaches assigned, number of clients, and locations (just need to be able to see the locations here, no need to add locations or edit them)
        3.1.3. Programs page
            - An admin user needs to be able to view, edit, and build workout programs across all gyms.
        3.1.4. Activities page
            - An admin user needs to be able to view, edit, add, and delete activities from across all gyms.
        3.1.5 Schedules page
            - An admin user needs to be able to view, edit, add, and delete weekly schedules from across all gyms.

    3.2. When an owner logs in, they should have the same nav options as the Admin user, but without the Users page, and add the following pages:
        3.2.1 Locations Page
            - Here an owner needs to be able to view, edit, add, and delete gym locations for their gym
        3.2.3. Coaches Page
            - here an owner needs to be able to view, edit, add, and delete coaches for their gym. Important data for their coaches is name, email, address, and phone number.
        3.2.4. For all the other pages, they need the same access as an owner, but all the data they interact with should be specific to their gym.

5. Workflow for mobile app
    5.1. This will only be used by client type users
    5.2. When a client logs in to the mobile app there should be 4 pages that they can navigate to: workout, benchmarks, schedule, and progress
    5.3. Workout Page
        - On this page the client should be able to select a day of out of the days of the week for that program week and see the activities they should be doing on that day. For lifts, during the workout they should be able to track how many sets they've done of an activity out of the total and be able see when they're done with the activity; this just needs to be tracked locally, so if it resets when they reload the page, that's ok.
    5.4. Benchmarks Page
        - On this page the client should be able to view their existing benchmarks and add new ones.
        - If a benchmark is less than 24 hours old, then the user should be able to edit that benchmark.
        - If it's older than 24 hours, then instead of an option to edit it, the user should see an option to replace the benchmark with a new one for that template. When they add a new one, the old one should get put in their benchmark historical data. This solves the issue of a user accidentally editing an old benchmark or adding multiple benchmarks for the same template (in their active benchmarks they should only have one for a given template)
        - When viewing their benchmarks, the user should be able to select from a dropdown of the existing tags for their benchmarks and filter down to benchmarks with those tags
    5.6. Schedule page
        - Here a client needs to be able to assign or remove themselves to timeslots on the active weekly schedule for the gym that they are a member of. Most of the time a client will want to get on the schedule with a specific coach, so they should be able to select a coach and filter down to the timeslots that coach is assigned to.
    5.7. Progress page
        - Here the user should be able to select a benchmark and see a line graph of their progress over time for their benchmarks that are based off of the same template. So, if they select "bench press" they should be able to see their progress over time on their "bench press" benchmarks.


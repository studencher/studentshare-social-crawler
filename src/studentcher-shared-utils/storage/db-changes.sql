alter table roles add column quizzes_management_enabled    BOOLEAN DEFAULT FALSE;
update roles set user_management_enabled = true, activity_management_enabled = true,  plan_management_enabled = true,  quizzes_management_enabled = true where name = 'Admin';

{
    "ownerId": "or@hyperactive.co.il",
    "name": "Folder 34",
    "srcUrl": null,
    "maxThresholdInDays": null,
    "responsibleRoleId": "72d9b829-5b56-11ed-bf7d-1db9b63514f2",
    "videos": [{
    "title": "Lesson 1",  "fileName": "studentcher-module/activities/lesson34_processed/l34_1.avi"},
   {"title": "Lesson 2",  "fileName": "studentcher-module/activities/lesson34_processed/l34_2.avi"},
   {"title": "Lesson 3",  "fileName": "studentcher-module/activities/lesson34_processed/l34_3.avi"},{
    "title": "Lesson 4",  "fileName": "studentcher-module/activities/lesson34_processed/l34_4.avi"},{
    "title": "Lesson 5",  "fileName": "studentcher-module/activities/lesson34_processed/l34_5.avi"},{
    "title": "Lesson 6",  "fileName": "studentcher-module/activities/lesson34_processed/l34_6.avi"},{
    "title": "Lesson 7",  "fileName": "studentcher-module/activities/lesson34_processed/l34_7.avi"},{
    "title": "Lesson 8",  "fileName": "studentcher-module/activities/lesson34_processed/l34_8.avi"},{
    "title": "Lesson 9",  "fileName": "studentcher-module/activities/lesson34_processed/l34_9.avi"},{
    "title": "Lesson 10", "fileName": "studentcher-module/activities/lesson34_processed/l34_10.avi"},{
    "title": "Lesson 11", "fileName": "studentcher-module/activities/lesson34_processed/l34_11.avi"},{
    "title": "Lesson 12", "fileName": "studentcher-module/activities/lesson34_processed/l34_12.avi"},{
    "title": "Lesson 13", "fileName": "studentcher-module/activities/lesson34_processed/l34_13.avi"},{
    "title": "Lesson 14", "fileName": "studentcher-module/activities/lesson34_processed/l34_14.avi"},{
    "title": "Lesson 15", "fileName": "studentcher-module/activities/lesson34_processed/l34_15.avi"},{
    "title": "Lesson 16", "fileName": "studentcher-module/activities/lesson34_processed/l34_16.avi"},{
    "title": "Lesson 17", "fileName": "studentcher-module/activities/lesson34_processed/l34_17.avi"},{
    "title": "Lesson 18", "fileName": "studentcher-module/activities/lesson34_processed/l34_18.avi"},{
    "title": "Lesson 19", "fileName": "studentcher-module/activities/lesson34_processed/l34_19.avi"},{
    "title": "Lesson 20", "fileName": "studentcher-module/activities/lesson34_processed/l34_20.avi"},{
    "title": "Lesson 21", "fileName": "studentcher-module/activities/lesson34_processed/l34_21.avi"},{
    "title": "Lesson 22", "fileName": "studentcher-module/activities/lesson34_processed/l34_22.avi"},{
    "title": "Lesson 23", "fileName": "studentcher-module/activities/lesson34_processed/l34_23.avi"},{
    "title": "Lesson 24", "fileName": "studentcher-module/activities/lesson34_processed/l34_24.avi"},{
    "title": "Lesson 25", "fileName": "studentcher-module/activities/lesson34_processed/l34_25.avi"},{
    "title": "Lesson 26", "fileName": "studentcher-module/activities/lesson34_processed/l34_26.avi"},{
    "title": "Lesson 27", "fileName": "studentcher-module/activities/lesson34_processed/l34_27.avi"}]
}

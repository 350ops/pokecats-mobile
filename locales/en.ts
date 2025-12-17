// English translations
export const en = {
    // Tab bar
    tabs: {
        map: 'Map',
        community: 'Community',
        clips: 'Clips',
        profile: 'Profile',
    },

    // Common
    common: {
        enabled: 'Enabled',
        disabled: 'Disabled',
        on: 'On',
        off: 'Off',
        cancel: 'Cancel',
        save: 'Save',
        saveChanges: 'Save Changes',
        done: 'Done',
        edit: 'Edit',
        delete: 'Delete',
        now: 'now',
        justNow: 'Just now',
        ago: 'ago',
        unknown: 'Unknown',
        error: 'Error',
        success: 'Success',
        loading: 'Loading...',
        english: 'English',
        spanish: 'Español',
        name: 'Name',
        photo: 'Photo',
        addComment: 'Add a comment',
    },

    // Time
    time: {
        minute: 'm',
        hour: 'h',
        day: 'd',
        week: 'w',
    },

    // Profile screen
    profile: {
        preferences: 'Preferences',
        account: 'Account',
        editProfile: 'Edit Profile',
        editProfileSubtitle: 'Update name, email, and area',
        privacy: 'Privacy',
        privacySubtitle: 'Control who sees your activity',
        appSettings: 'App Settings',
        systemSettings: 'System Settings',
        systemSettingsSubtitle: 'Manage permissions in iOS Settings',
        helpSupport: 'Help & Support',
        about: 'About PokéCats',
        notifications: 'Notifications',
        locationAccess: 'Location Access',
        darkMode: 'Dark Mode',
        language: 'Language',
        logOut: 'Log Out',
        sightings: 'Sightings',
        timesFed: 'Times Fed',
        clips: 'Clips',
        comingSoon: 'Coming Soon',
        privacyComingSoon: 'Privacy settings will be available in a future update.',
        helpMessage: 'Contact us at support@pokecats.app',
        aboutMessage: 'Helping communities care for stray cats.',
        version: 'Version',
    },

    // Map screen
    map: {
        catsNearby: 'cats nearby',
        explore: 'Explore',
        hybrid: 'Hybrid',
        satellite: 'Satellite',
        selectMapMode: 'Select Map Mode',
        poweredByApple: 'Powered by Apple Maps',
    },

    // Cat card
    catCard: {
        lastFed: 'Last Fed',
        seen: 'Seen',
        tnr: 'TNR',
        neutered: 'Neutered',
        notNeutered: 'Not Neutered',
        healthy: 'Healthy',
        needsHelp: 'Needs Help',
        hungry: 'Hungry',
        adopted: 'Adopted',
    },

    // Actions
    actions: {
        seen: 'Seen',
        edit: 'Edit',
        photo: 'Photo',
        feed: 'Feed',
        feeding: 'Feeding...',
        go: 'Go',
        setAsMainPhoto: 'Set as Main Photo',
        setAsMainPhotoMessage: 'Use this photo as the main profile picture?',
        setAsMain: 'Set as Main',
    },

    // Community
    community: {
        all: 'All',
        urgent: 'Urgent',
        questions: 'Questions',
        post: 'Post',
        sighting: 'Sighting',
        question: 'Question',
        medicalAlert: 'Medical Alert',
        successStory: 'Success Story',
        tnr: 'TNR',
        badge: 'Badge (choose one)',
        yourPost: 'Your post',
        tagCats: 'Tag cats (optional)',
        searchOrAddCat: 'Search or add a cat name',
        add: 'Add',
        photoOptional: 'Photo (optional)',
        addPhoto: 'Add photo',
        shareUpdate: 'Share an update...',
        comments: 'Comments',
        addComment: 'Add a comment…',
        beFirstToComment: 'Be the first to comment.',
    },

    // Clips
    clips: {
        title: 'Cat Clips',
        subtitle: 'Short videos shared by the community',
        clip: 'Clip',
        noClips: 'No clips yet',
        recordFirst: 'Record your first cat clip!',
        addClip: 'Add Clip',
    },

    // Edit Cat
    editCat: {
        title: 'Edit Cat',
        photo: 'Photo',
        tapToSelectPhoto: 'Tap to select photo',
        name: 'Name *',
        enterName: "Enter cat's name",
        mainFurColor: 'Main Fur Color',
        selectColor: 'Select color',
        furPattern: 'Fur Pattern',
        selectPattern: 'Select pattern',
        sex: 'Sex',
        approximateAge: 'Approximate Age',
        location: 'Location',
        tapToSetLocation: 'Tap to set location on map',
        locationSet: 'Location set',
        status: 'Status',
        notes: 'Notes',
        notesHelper: 'Health, behavior, or identification details',
        notesPlaceholder: 'e.g., Visible limp, friendly, ear tipped...',
        additionalPhotos: 'Additional Photos',
        addPhoto: 'Add Photo',
        needsAttention: 'Needs Attention?',
        needsAttentionSubtitle: 'This cat may need help',
        saving: 'Saving...',
        saveChanges: 'Save Changes',
        deleteCat: 'Delete Cat',
        confirmDelete: 'Delete Cat',
        confirmDeleteMessage: 'Are you sure you want to delete {name}? This action cannot be undone.',
    },

    // Fur patterns
    patterns: {
        solid: 'Solid',
        tabby: 'Tabby (Striped)',
        spotted: 'Spotted',
        bicolor: 'Bicolour (Two colors)',
        calico: 'Calico',
        tortoiseshell: 'Tortoiseshell',
        pointed: 'Pointed (Siamese-like)',
        unknown: 'Unknown',
    },

    // Colors
    colors: {
        white: 'White',
        black: 'Black',
        orange: 'Orange (Ginger)',
        grey: 'Grey',
        brown: 'Brown',
        cream: 'Cream',
        mixed: 'Mixed / Multicolour',
    },

    // Sex
    sex: {
        male: 'Male',
        female: 'Female',
        unknown: 'Unknown',
    },

    // Age
    age: {
        kitten: 'Kitten',
        young: 'Young',
        adult: 'Adult',
        senior: 'Senior',
    },

    // Alerts
    alerts: {
        permissionNeeded: 'Permission needed',
        cameraPermission: 'Camera access is required to take photos.',
        notificationPermission: 'Enable notifications in system settings to stay informed.',
        locationPermission: 'Location access keeps your alerts relevant. You can enable it in Settings.',
        uploadFailed: 'Upload Failed',
        couldNotUpload: 'Could not upload photo.',
        somethingWentWrong: 'Something went wrong.',
        failedToRecordSighting: 'Failed to record sighting.',
        failedToSetPrimaryPhoto: 'Failed to set primary photo.',
        confirmDelete: 'Are you sure you want to delete this cat?',
        deleteWarning: 'This action cannot be undone.',
    },
};

export type Translations = typeof en;
export type TranslationKey = keyof typeof en;


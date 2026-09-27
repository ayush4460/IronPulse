const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const EXERCISES = [
  // CHEST
  { name: 'Barbell Bench Press', slug: 'barbell-bench-press', primaryMuscle: 'CHEST', category: 'BARBELL', instructions: 'Lie on bench, grip barbell slightly wider than shoulder width, lower bar to mid-chest, press upwards explosively.', defaultRestSeconds: 120 },
  { name: 'Incline Barbell Bench Press', slug: 'incline-barbell-bench-press', primaryMuscle: 'CHEST', category: 'BARBELL', instructions: 'Set bench to 30-45 degrees, lower bar to upper chest, press up.', defaultRestSeconds: 120 },
  { name: 'Decline Barbell Bench Press', slug: 'decline-barbell-bench-press', primaryMuscle: 'CHEST', category: 'BARBELL', instructions: 'Set decline bench, lower bar smoothly to lower chest, press up.', defaultRestSeconds: 90 },
  { name: 'Flat Dumbbell Bench Press', slug: 'flat-dumbbell-bench-press', primaryMuscle: 'CHEST', category: 'DUMBBELL', instructions: 'Lie flat with dumbbells at chest level, press up until arms are extended without clashing weights.', defaultRestSeconds: 90 },
  { name: 'Incline Dumbbell Press', slug: 'incline-dumbbell-press', primaryMuscle: 'CHEST', category: 'DUMBBELL', instructions: 'Set bench at 30-45 degrees, press dumbbells overhead in an arcing motion.', defaultRestSeconds: 90 },
  { name: 'Decline Dumbbell Press', slug: 'decline-dumbbell-press', primaryMuscle: 'CHEST', category: 'DUMBBELL', instructions: 'Decline angle, press dumbbells maintaining core tension.', defaultRestSeconds: 90 },
  { name: 'Dumbbell Chest Fly', slug: 'dumbbell-chest-fly', primaryMuscle: 'CHEST', category: 'DUMBBELL', instructions: 'Flat bench, slight bend at elbows, open arms wide feeling deep chest stretch, squeeze chest together at top.', defaultRestSeconds: 60 },
  { name: 'Incline Dumbbell Fly', slug: 'incline-dumbbell-fly', primaryMuscle: 'CHEST', category: 'DUMBBELL', instructions: 'Incline angle, open arms wide for upper pectoral stretch.', defaultRestSeconds: 60 },
  { name: 'Cable Crossover', slug: 'cable-crossover', primaryMuscle: 'CHEST', category: 'CABLE', instructions: 'Standing tall with split stance, bring cable handles together in front of lower chest.', defaultRestSeconds: 60 },
  { name: 'Low Cable Fly', slug: 'low-cable-fly', primaryMuscle: 'CHEST', category: 'CABLE', instructions: 'Cables set low, raise hands up and inward to clavicle level.', defaultRestSeconds: 60 },
  { name: 'Chest Press Machine', slug: 'chest-press-machine', primaryMuscle: 'CHEST', category: 'MACHINE', instructions: 'Adjust seat so handles align with mid-chest, drive elbows forward, squeeze chest.', defaultRestSeconds: 90 },
  { name: 'Pec Deck Machine Fly', slug: 'pec-deck-machine-fly', primaryMuscle: 'CHEST', category: 'MACHINE', instructions: 'Keep elbows slightly bent, contract chest to bring pads together.', defaultRestSeconds: 60 },
  { name: 'Chest Dip (Bodyweight/Weighted)', slug: 'chest-dip', primaryMuscle: 'CHEST', category: 'BODYWEIGHT', instructions: 'Lean torso forward about 30 degrees, flare elbows slightly, lower till 90 degree angle, push up.', defaultRestSeconds: 90 },
  { name: 'Push Up', slug: 'push-up', primaryMuscle: 'CHEST', category: 'BODYWEIGHT', instructions: 'Hands shoulder-width apart, rigid core plank, lower chest to floor, drive up.', defaultRestSeconds: 60 },

  // BACK
  { name: 'Conventional Deadlift', slug: 'conventional-deadlift', primaryMuscle: 'BACK', category: 'BARBELL', instructions: 'Feet hip-width, grip barbell outside shins, chest high, push floor away engaging lats and glutes.', defaultRestSeconds: 180 },
  { name: 'Barbell Bent Over Row', slug: 'barbell-bent-over-row', primaryMuscle: 'BACK', category: 'BARBELL', instructions: 'Hinge hips to 45 degrees, pull barbell to lower ribcage keeping elbows tucked.', defaultRestSeconds: 120 },
  { name: 'Pendlay Row', slug: 'pendlay-row', primaryMuscle: 'BACK', category: 'BARBELL', instructions: 'Torso parallel to floor, pull bar explosively from dead stop on floor to chest.', defaultRestSeconds: 120 },
  { name: 'T-Bar Row', slug: 't-bar-row', primaryMuscle: 'BACK', category: 'BARBELL', instructions: 'Straddle bar, keep spine neutral, row weight into abdominal area.', defaultRestSeconds: 90 },
  { name: 'Lat Pulldown', slug: 'lat-pulldown', primaryMuscle: 'BACK', category: 'CABLE', instructions: 'Wide overhand grip, drive elbows down and back, pull bar to upper chest.', defaultRestSeconds: 90 },
  { name: 'Close Grip Lat Pulldown', slug: 'close-grip-lat-pulldown', primaryMuscle: 'BACK', category: 'CABLE', instructions: 'V-bar attachment, pull to upper chest emphasizing lower lats.', defaultRestSeconds: 90 },
  { name: 'Seated Cable Row', slug: 'seated-cable-row', primaryMuscle: 'BACK', category: 'CABLE', instructions: 'Upright posture, drive elbows back past torso, squeeze scapulae together.', defaultRestSeconds: 90 },
  { name: 'Single Arm Dumbbell Row', slug: 'single-arm-dumbbell-row', primaryMuscle: 'BACK', category: 'DUMBBELL', instructions: 'One hand and knee on bench, pull dumbbell towards hip pocket.', defaultRestSeconds: 60 },
  { name: 'Pull Up', slug: 'pull-up', primaryMuscle: 'BACK', category: 'BODYWEIGHT', instructions: 'Overhand grip wider than shoulders, pull chin over bar leading with chest.', defaultRestSeconds: 120 },
  { name: 'Chin Up', slug: 'chin-up', primaryMuscle: 'BACK', category: 'BODYWEIGHT', instructions: 'Underhand shoulder-width grip, pull chest to bar engaging lats and biceps.', defaultRestSeconds: 120 },
  { name: 'Chest Supported Row Machine', slug: 'chest-supported-row-machine', primaryMuscle: 'BACK', category: 'MACHINE', instructions: 'Rest chest firmly on pad, pull handles back without swinging torso.', defaultRestSeconds: 90 },
  { name: 'Straight Arm Cable Pulldown', slug: 'straight-arm-cable-pulldown', primaryMuscle: 'BACK', category: 'CABLE', instructions: 'Lock arms with slight elbow bend, sweep bar in an arc down to thighs.', defaultRestSeconds: 60 },
  { name: 'Face Pull', slug: 'face-pull', primaryMuscle: 'BACK', category: 'CABLE', instructions: 'Rope attachment at eye level, pull towards face while externally rotating shoulders.', defaultRestSeconds: 60 },
  { name: 'Barbell Shrug', slug: 'barbell-shrug', primaryMuscle: 'BACK', category: 'BARBELL', instructions: 'Elevate shoulders directly towards ears, pause for peak contraction, lower slowly.', defaultRestSeconds: 60 },
  { name: 'Dumbbell Shrug', slug: 'dumbbell-shrug', primaryMuscle: 'BACK', category: 'DUMBBELL', instructions: 'Hold heavy dumbbells at sides, shrug shoulders up and hold 1 second.', defaultRestSeconds: 60 },
  { name: 'Back Extension (Hyperextension)', slug: 'back-extension', primaryMuscle: 'BACK', category: 'BODYWEIGHT', instructions: 'Hinge forward at hips, contract lower back, glutes, and hamstrings to return level.', defaultRestSeconds: 60 },

  // SHOULDERS
  { name: 'Standing Overhead Barbell Press (OHP)', slug: 'overhead-barbell-press', primaryMuscle: 'SHOULDERS', category: 'BARBELL', instructions: 'Stand tall, squeeze glutes, press barbell straight overhead locking arms out.', defaultRestSeconds: 120 },
  { name: 'Seated Dumbbell Shoulder Press', slug: 'seated-dumbbell-shoulder-press', primaryMuscle: 'SHOULDERS', category: 'DUMBBELL', instructions: 'Sit on upright bench, press dumbbells overhead in a smooth arc.', defaultRestSeconds: 90 },
  { name: 'Arnold Press', slug: 'arnold-press', primaryMuscle: 'SHOULDERS', category: 'DUMBBELL', instructions: 'Start palms facing chest, rotate outwards as you press overhead.', defaultRestSeconds: 90 },
  { name: 'Dumbbell Lateral Raise', slug: 'dumbbell-lateral-raise', primaryMuscle: 'SHOULDERS', category: 'DUMBBELL', instructions: 'Raise arms out to sides with slight elbow bend until parallel with floor.', defaultRestSeconds: 60 },
  { name: 'Cable Lateral Raise', slug: 'cable-lateral-raise', primaryMuscle: 'SHOULDERS', category: 'CABLE', instructions: 'Continuous tension on side delts, raise cable handle out to shoulder level.', defaultRestSeconds: 60 },
  { name: 'Machine Lateral Raise', slug: 'machine-lateral-raise', primaryMuscle: 'SHOULDERS', category: 'MACHINE', instructions: 'Elbows against pads, lift through elbows to shoulder height.', defaultRestSeconds: 60 },
  { name: 'Rear Delt Dumbbell Fly', slug: 'rear-delt-dumbbell-fly', primaryMuscle: 'SHOULDERS', category: 'DUMBBELL', instructions: 'Bent over at hips, raise dumbbells outward to target posterior deltoids.', defaultRestSeconds: 60 },
  { name: 'Reverse Pec Deck Fly', slug: 'reverse-pec-deck-fly', primaryMuscle: 'SHOULDERS', category: 'MACHINE', instructions: 'Chest against pad, swing arms backward focusing on rear shoulders.', defaultRestSeconds: 60 },
  { name: 'Front Dumbbell Raise', slug: 'front-dumbbell-raise', primaryMuscle: 'SHOULDERS', category: 'DUMBBELL', instructions: 'Raise dumbbells in front of torso to eye level.', defaultRestSeconds: 60 },
  { name: 'Barbell Upright Row', slug: 'barbell-upright-row', primaryMuscle: 'SHOULDERS', category: 'BARBELL', instructions: 'Grip shoulder width, pull bar up towards chin leading with elbows.', defaultRestSeconds: 75 },

  // BICEPS
  { name: 'Barbell Bicep Curl', slug: 'barbell-bicep-curl', primaryMuscle: 'BICEPS', category: 'BARBELL', instructions: 'Supinated grip, curl barbell keeping elbows pinned to ribs.', defaultRestSeconds: 90 },
  { name: 'EZ-Bar Curl', slug: 'ez-bar-curl', primaryMuscle: 'BICEPS', category: 'BARBELL', instructions: 'Curved bar reduces wrist strain, curl smoothly to chest level.', defaultRestSeconds: 90 },
  { name: 'Dumbbell Alternating Curl', slug: 'dumbbell-alternating-curl', primaryMuscle: 'BICEPS', category: 'DUMBBELL', instructions: 'Alternate arms, supinate wrist at peak contraction.', defaultRestSeconds: 60 },
  { name: 'Dumbbell Hammer Curl', slug: 'dumbbell-hammer-curl', primaryMuscle: 'BICEPS', category: 'DUMBBELL', instructions: 'Neutral grip (thumbs pointing up), targets brachialis and forearms.', defaultRestSeconds: 60 },
  { name: 'Incline Dumbbell Curl', slug: 'incline-dumbbell-curl', primaryMuscle: 'BICEPS', category: 'DUMBBELL', instructions: 'Sit on incline bench, arms hang back for maximum bicep stretch, curl up.', defaultRestSeconds: 75 },
  { name: 'Preacher Curl (EZ-Bar/Machine)', slug: 'preacher-curl', primaryMuscle: 'BICEPS', category: 'MACHINE', instructions: 'Arms locked onto preacher pad, isolate biceps with zero body swing.', defaultRestSeconds: 60 },
  { name: 'Concentration Curl', slug: 'concentration-curl', primaryMuscle: 'BICEPS', category: 'DUMBBELL', instructions: 'Elbow anchored against inner thigh, curl dumbbell with strict focus.', defaultRestSeconds: 60 },
  { name: 'Cable Bicep Curl', slug: 'cable-bicep-curl', primaryMuscle: 'BICEPS', category: 'CABLE', instructions: 'Straight bar on low cable pulley, smooth tension throughout range.', defaultRestSeconds: 60 },
  { name: 'Cable Rope Hammer Curl', slug: 'cable-rope-hammer-curl', primaryMuscle: 'BICEPS', category: 'CABLE', instructions: 'Rope on low cable, flare ends outward at peak contraction.', defaultRestSeconds: 60 },

  // TRICEPS
  { name: 'Close Grip Bench Press', slug: 'close-grip-bench-press', primaryMuscle: 'TRICEPS', category: 'BARBELL', instructions: 'Hands shoulder-width apart, elbows tucked, press up using triceps.', defaultRestSeconds: 90 },
  { name: 'Skull Crusher (Lying Triceps Extension)', slug: 'skull-crusher', primaryMuscle: 'TRICEPS', category: 'BARBELL', instructions: 'Lie on bench, lower EZ-bar toward forehead, extend elbows to return.', defaultRestSeconds: 90 },
  { name: 'Cable Tricep Rope Pushdown', slug: 'cable-tricep-rope-pushdown', primaryMuscle: 'TRICEPS', category: 'CABLE', instructions: 'Spread rope handles apart at bottom of motion, squeeze triceps.', defaultRestSeconds: 60 },
  { name: 'Straight Bar Cable Pushdown', slug: 'straight-bar-cable-pushdown', primaryMuscle: 'TRICEPS', category: 'CABLE', instructions: 'Overhand grip, press bar down to thighs.', defaultRestSeconds: 60 },
  { name: 'Overhead Cable Tricep Extension', slug: 'overhead-cable-tricep-extension', primaryMuscle: 'TRICEPS', category: 'CABLE', instructions: 'Pull rope overhead facing away from cable tower for long head stretch.', defaultRestSeconds: 60 },
  { name: 'Overhead Dumbbell Extension', slug: 'overhead-dumbbell-extension', primaryMuscle: 'TRICEPS', category: 'DUMBBELL', instructions: 'Hold one heavy dumbbell with both hands overhead, lower behind head.', defaultRestSeconds: 60 },
  { name: 'Tricep Dip (Parallel Bars)', slug: 'tricep-dip', primaryMuscle: 'TRICEPS', category: 'BODYWEIGHT', instructions: 'Keep torso upright, elbows tucked close, push to full extension.', defaultRestSeconds: 90 },
  { name: 'Bench Dip', slug: 'bench-dip', primaryMuscle: 'TRICEPS', category: 'BODYWEIGHT', instructions: 'Hands on bench behind back, dip hips down and press back up.', defaultRestSeconds: 60 },

  // QUADS
  { name: 'Barbell Back Squat', slug: 'barbell-back-squat', primaryMuscle: 'QUADS', category: 'BARBELL', instructions: 'Bar on upper traps, descend until thighs parallel floor, drive through heels.', defaultRestSeconds: 150 },
  { name: 'Barbell Front Squat', slug: 'barbell-front-squat', primaryMuscle: 'QUADS', category: 'BARBELL', instructions: 'Bar resting on front deltoids, upright torso, deep squat engaging quads.', defaultRestSeconds: 150 },
  { name: 'Leg Press (45 Degree)', slug: 'leg-press-45', primaryMuscle: 'QUADS', category: 'MACHINE', instructions: 'Feet hip-width on sled, lower until knees at 90 degrees, press without locking knees.', defaultRestSeconds: 120 },
  { name: 'Hack Squat', slug: 'hack-squat', primaryMuscle: 'QUADS', category: 'MACHINE', instructions: 'Back flush against machine pad, squat low for tremendous quad loading.', defaultRestSeconds: 120 },
  { name: 'Leg Extension Machine', slug: 'leg-extension-machine', primaryMuscle: 'QUADS', category: 'MACHINE', instructions: 'Extend legs to full lockout, squeeze quads at top, slow descent.', defaultRestSeconds: 60 },
  { name: 'Bulgarian Split Squat', slug: 'bulgarian-split-squat', primaryMuscle: 'QUADS', category: 'DUMBBELL', instructions: 'Rear foot elevated on bench, lower front knee to 90 degrees, drive upwards.', defaultRestSeconds: 90 },
  { name: 'Dumbbell Walking Lunge', slug: 'dumbbell-walking-lunge', primaryMuscle: 'QUADS', category: 'DUMBBELL', instructions: 'Step forward into deep lunge, alternate legs smoothly.', defaultRestSeconds: 90 },
  { name: 'Goblet Squat', slug: 'goblet-squat', primaryMuscle: 'QUADS', category: 'DUMBBELL', instructions: 'Hold dumbbell vertically against chest, squat deep keeping upright.', defaultRestSeconds: 75 },
  { name: 'Smith Machine Squat', slug: 'smith-machine-squat', primaryMuscle: 'QUADS', category: 'MACHINE', instructions: 'Guided barbell path allows focused quad isolation and controlled depth.', defaultRestSeconds: 90 },

  // HAMSTRINGS
  { name: 'Romanian Deadlift (Barbell RDL)', slug: 'barbell-romanian-deadlift', primaryMuscle: 'HAMSTRINGS', category: 'BARBELL', instructions: 'Slight knee bend, push hips back until hamstrings stretch deeply, stand up.', defaultRestSeconds: 120 },
  { name: 'Dumbbell Romanian Deadlift', slug: 'dumbbell-romanian-deadlift', primaryMuscle: 'HAMSTRINGS', category: 'DUMBBELL', instructions: 'Slide dumbbells down front of shins, hinge hips back, squeeze glutes to lock.', defaultRestSeconds: 90 },
  { name: 'Lying Leg Curl Machine', slug: 'lying-leg-curl', primaryMuscle: 'HAMSTRINGS', category: 'MACHINE', instructions: 'Lie prone, curl heels towards glutes, control negative descent.', defaultRestSeconds: 60 },
  { name: 'Seated Leg Curl Machine', slug: 'seated-leg-curl', primaryMuscle: 'HAMSTRINGS', category: 'MACHINE', instructions: 'Pin knees under pad, pull heels under seat through full range.', defaultRestSeconds: 60 },
  { name: 'Stiff Leg Deadlift', slug: 'stiff-leg-deadlift', primaryMuscle: 'HAMSTRINGS', category: 'BARBELL', instructions: 'Maintain minimal knee flexion, hinge deeply for hamstring emphasis.', defaultRestSeconds: 120 },
  { name: 'Good Morning', slug: 'good-morning', primaryMuscle: 'HAMSTRINGS', category: 'BARBELL', instructions: 'Barbell on shoulders, bow forward at hips until torso is near parallel.', defaultRestSeconds: 90 },

  // GLUTES
  { name: 'Barbell Hip Thrust', slug: 'barbell-hip-thrust', primaryMuscle: 'GLUTES', category: 'BARBELL', instructions: 'Upper back on bench, barbell across hips, drive hips towards ceiling, lock glutes at top.', defaultRestSeconds: 120 },
  { name: 'Dumbbell Hip Thrust', slug: 'dumbbell-hip-thrust', primaryMuscle: 'GLUTES', category: 'DUMBBELL', instructions: 'Dumbbell across pelvis, thrust upward squeezing glutes for 1 sec pause.', defaultRestSeconds: 90 },
  { name: 'Hip Abduction Machine', slug: 'hip-abduction-machine', primaryMuscle: 'GLUTES', category: 'MACHINE', instructions: 'Push pads outward against resistance targeting glute medius.', defaultRestSeconds: 60 },
  { name: 'Cable Glute Kickback', slug: 'cable-glute-kickback', primaryMuscle: 'GLUTES', category: 'CABLE', instructions: 'Ankle strap attached to low cable, kick leg back with squeeze in glute.', defaultRestSeconds: 60 },
  { name: 'Cable Pull-Through', slug: 'cable-pull-through', primaryMuscle: 'GLUTES', category: 'CABLE', instructions: 'Rope between legs facing away from cable, hinge back and snap hips forward.', defaultRestSeconds: 60 },

  // CALVES
  { name: 'Standing Calf Raise', slug: 'standing-calf-raise', primaryMuscle: 'CALVES', category: 'MACHINE', instructions: 'Balls of feet on ledge, drop heels for deep stretch, rise high onto toes.', defaultRestSeconds: 60 },
  { name: 'Seated Calf Raise', slug: 'seated-calf-raise', primaryMuscle: 'CALVES', category: 'MACHINE', instructions: 'Knees bent 90 degrees, isolates the soleus calf muscle.', defaultRestSeconds: 60 },
  { name: 'Leg Press Calf Raise', slug: 'leg-press-calf-raise', primaryMuscle: 'CALVES', category: 'MACHINE', instructions: 'Balls of feet on lower edge of leg press platform, flex ankles.', defaultRestSeconds: 60 },
  { name: 'Dumbbell Single Leg Calf Raise', slug: 'single-leg-calf-raise', primaryMuscle: 'CALVES', category: 'DUMBBELL', instructions: 'Hold dumbbell on one side, perform calf raise on an elevated step.', defaultRestSeconds: 45 },

  // CORE / ABS
  { name: 'Hanging Leg Raise', slug: 'hanging-leg-raise', primaryMuscle: 'CORE', category: 'BODYWEIGHT', instructions: 'Hang from pull up bar, raise straight legs to horizontal or toes to bar.', defaultRestSeconds: 60 },
  { name: 'Captains Chair Knee Raise', slug: 'captains-chair-knee-raise', primaryMuscle: 'CORE', category: 'BODYWEIGHT', instructions: 'Forearms rested on pads, pull knees smoothly to chest.', defaultRestSeconds: 60 },
  { name: 'Cable Kneeling Crunch', slug: 'cable-kneeling-crunch', primaryMuscle: 'CORE', category: 'CABLE', instructions: 'Kneel below high pulley holding rope at forehead, curl spine downwards.', defaultRestSeconds: 60 },
  { name: 'Ab Wheel Rollout', slug: 'ab-wheel-rollout', primaryMuscle: 'CORE', category: 'BODYWEIGHT', instructions: 'Kneel holding wheel, roll forward keeping spine slightly rounded, return using abs.', defaultRestSeconds: 60 },
  { name: 'Plank', slug: 'plank', primaryMuscle: 'CORE', category: 'BODYWEIGHT', instructions: 'Hold forearm plank maintaining solid glute and ab contraction.', defaultRestSeconds: 60 },
  { name: 'Russian Twist', slug: 'russian-twist', primaryMuscle: 'CORE', category: 'BODYWEIGHT', instructions: 'Seated V-position, rotate shoulders and tap weight side to side.', defaultRestSeconds: 45 },
  { name: 'Cable Woodchopper', slug: 'cable-woodchopper', primaryMuscle: 'CORE', category: 'CABLE', instructions: 'Rotate torso diagonally downwards engaging obliques.', defaultRestSeconds: 60 },
  { name: 'Decline Bench Crunch', slug: 'decline-bench-crunch', primaryMuscle: 'CORE', category: 'BODYWEIGHT', instructions: 'Feet locked in decline bench, curl torso upward focusing on abs.', defaultRestSeconds: 60 },

  // FOREARMS
  { name: 'Barbell Wrist Curl', slug: 'barbell-wrist-curl', primaryMuscle: 'FOREARMS', category: 'BARBELL', instructions: 'Forearms resting on bench, curl wrists upward.', defaultRestSeconds: 45 },
  { name: 'Reverse Barbell Curl', slug: 'reverse-barbell-curl', primaryMuscle: 'FOREARMS', category: 'BARBELL', instructions: 'Overhand grip curl targeting brachioradialis.', defaultRestSeconds: 60 },
  { name: 'Farmers Walk', slug: 'farmers-walk', primaryMuscle: 'FOREARMS', category: 'DUMBBELL', instructions: 'Carry two heavy dumbbells/kettlebells for distance with upright posture.', defaultRestSeconds: 90 },

  // CARDIO
  { name: 'Treadmill Running / Walking', slug: 'treadmill-running', primaryMuscle: 'CARDIO', category: 'OTHER', instructions: 'Cardiovascular endurance training on treadmill.', defaultRestSeconds: 60 },
  { name: 'Stationary Rowing Machine', slug: 'stationary-rower', primaryMuscle: 'CARDIO', category: 'OTHER', instructions: 'Full body aerobic conditioning, leg drive followed by row stroke.', defaultRestSeconds: 60 },
  { name: 'Stair Climber', slug: 'stair-climber', primaryMuscle: 'CARDIO', category: 'OTHER', instructions: 'Continuous step climbing for aerobic capacity and glute/calf endurance.', defaultRestSeconds: 60 },
  { name: 'Stationary Assault Bike', slug: 'assault-bike', primaryMuscle: 'CARDIO', category: 'OTHER', instructions: 'High intensity interval aerobic conditioning with arm & leg propulsion.', defaultRestSeconds: 60 },
  { name: 'Jump Rope', slug: 'jump-rope', primaryMuscle: 'CARDIO', category: 'BODYWEIGHT', instructions: 'Rhythmic bounding for conditioning, footwork, and calf conditioning.', defaultRestSeconds: 45 },
];

async function main() {
  console.log('Seeding standard exercise library...');
  for (const item of EXERCISES) {
    await prisma.exercise.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        primaryMuscle: item.primaryMuscle,
        category: item.category,
        instructions: item.instructions,
        defaultRestSeconds: item.defaultRestSeconds,
      },
      create: {
        name: item.name,
        slug: item.slug,
        primaryMuscle: item.primaryMuscle,
        category: item.category,
        instructions: item.instructions,
        defaultRestSeconds: item.defaultRestSeconds,
        isCustom: false,
      },
    });
  }
  console.log(`Successfully seeded ${EXERCISES.length} standard gym exercises!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

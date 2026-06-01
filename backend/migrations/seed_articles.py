"""Run: python migrations/seed_articles.py"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from dotenv import load_dotenv
load_dotenv()

from app.db.session import SessionLocal
from app.models.article import Article

ARTICLES = [
    {"title": "Understanding the Baby Blues", "category": "Postpartum Emotions", "read_time_minutes": 3,
     "content": "The 'baby blues' affect up to 80% of new mothers. In the first one to two weeks after birth, many women experience sudden mood swings, tearfulness, irritability, and anxiety. These feelings are caused by the dramatic hormonal shift — estrogen and progesterone drop sharply after delivery while prolactin rises for breastfeeding.\n\nBaby blues typically peak around day 3-5 and resolve within two weeks without treatment. What you're feeling is a normal physiological response, not a character flaw or sign you're a bad mother.\n\nTo support yourself: accept help when offered, rest whenever possible, eat nourishing food, and talk openly with a trusted friend. If feelings persist beyond two weeks, reach out to your healthcare provider."},
    {"title": "When Sadness Doesn't Lift: Recognizing PPD", "category": "Postpartum Emotions", "read_time_minutes": 4,
     "content": "Postpartum depression (PPD) affects 1 in 7 mothers and can develop any time in the first year after birth. Unlike baby blues, PPD doesn't resolve on its own.\n\nSigns include: persistent sadness, loss of interest in activities, difficulty bonding with your baby, withdrawing from family, changes in appetite or sleep, feeling worthless or guilty.\n\nPPD is not your fault. It is a medical condition. Effective treatments include therapy, medication, and support groups. Please reach out to your OB or midwife if you recognize these signs."},
    {"title": "The Identity Shift of New Motherhood", "category": "Postpartum Emotions", "read_time_minutes": 3,
     "content": "Researchers call it matrescence — the profound psychological transformation of becoming a mother. It involves a complete reshaping of identity, priorities, and sense of self.\n\nMany mothers describe feeling like they've lost themselves. This grief is real and valid, even when you love your child deeply.\n\nBoth things can be true: you can love your baby completely and also grieve the life you had before. Giving yourself permission to mourn the old self while discovering the new one is part of the journey."},
    {"title": "Box Breathing for Anxious Moments", "category": "Managing Anxiety", "read_time_minutes": 2,
     "content": "Box breathing activates your parasympathetic nervous system — countering the fight-or-flight stress response.\n\nHow to do it:\n1. Breathe in through your nose for 4 counts\n2. Hold for 4 counts\n3. Exhale for 4 counts\n4. Hold empty for 4 counts\n5. Repeat 4 times\n\nYou can do this anywhere — during a 3 AM feed, in the car, or in the bathroom. Research shows it reduces cortisol levels within minutes."},
    {"title": "The Worry Time Technique", "category": "Managing Anxiety", "read_time_minutes": 3,
     "content": "The worry time technique from CBT gives your anxiety a designated container.\n\n1. Choose a 15-minute window each day as your official worry time\n2. When a worry appears outside this window, write it down\n3. At worry time, review your list and problem-solve what you can\n4. When time ends, close the notebook\n\nMost mothers find that by the time worry time arrives, many concerns feel less urgent."},
    {"title": "Grounding Techniques for Panic", "category": "Managing Anxiety", "read_time_minutes": 2,
     "content": "When anxiety spikes, grounding techniques bring you back to the present moment.\n\nThe 5-4-3-2-1 technique:\n- Name 5 things you can see\n- Name 4 things you can physically feel\n- Name 3 things you can hear\n- Name 2 things you can smell\n- Name 1 thing you can taste\n\nThis redirects your nervous system from imagined future threats to real present sensations. Practice it daily so it becomes automatic."},
    {"title": "Micro Self-Care: 5 Minutes That Matter", "category": "Self-Care", "read_time_minutes": 3,
     "content": "Traditional self-care advice feels laughable when you have a newborn. But micro self-care practiced consistently makes a real difference.\n\nFive-minute practices that work:\n- Step outside for fresh air and daylight\n- Drink a full glass of water slowly\n- Stretch your neck and shoulders\n- Text one friend something honest\n- Do the 5-4-3-2-1 grounding technique\n\nStack micro-moments. You cannot pour from an empty cup — even tiny refills matter."},
    {"title": "Asking for Help is a Skill", "category": "Self-Care", "read_time_minutes": 3,
     "content": "Many mothers struggle to ask for help. But asking for help is a learnable skill and may be the most important thing you do for your mental health.\n\nPractical approaches:\n- Be specific: 'Can you bring dinner Thursday?' works better than 'Let me know if you can help'\n- Accept imperfect help graciously\n- People who care about you want to help. Let them."},
    {"title": "Rest Without Guilt", "category": "Self-Care", "read_time_minutes": 2,
     "content": "Rest is not a reward for finishing everything — it is a necessity for functioning.\n\nThe guilt you feel when resting is a cultural artifact, not a moral fact. Your baby needs a regulated, present mother more than a perfect, exhausted one.\n\nPermission slip: you are allowed to rest. You are allowed to sit down. You are allowed to do nothing for 10 minutes. Rest is recovery."},
    {"title": "Sleep Deprivation and Your Mental Health", "category": "Sleep & Mood", "read_time_minutes": 4,
     "content": "Sleep deprivation is the single most significant stressor for new mothers. After 24 hours without sleep, emotional reactivity increases by 60%.\n\nThe prefrontal cortex — responsible for rational thinking — goes offline first. The amygdala — the emotion center — becomes hyperactive. This is why small things feel catastrophic at 4 AM.\n\nPractical strategies: sleep when the baby sleeps, take shifts with your partner, avoid screens before sleep.\n\nRemember: your feelings at 3 AM are not an accurate picture of your life."},
    {"title": "Evening Wind-Down with a Newborn", "category": "Sleep & Mood", "read_time_minutes": 2,
     "content": "Creating even a minimal evening routine signals to your nervous system that rest is coming.\n\nA 20-minute wind-down:\n1. Dim the lights after 8 PM\n2. Put your phone face-down\n3. Write tomorrow's top 3 concerns\n4. Spend 5 minutes stretching or sitting quietly with a warm drink\n5. Body scan: notice tension and release it\n\nMany mothers find that even interrupted sleep feels more restorative after a proper wind-down."},
    {"title": "Why You Cry at Everything Now", "category": "Sleep & Mood", "read_time_minutes": 2,
     "content": "If you find yourself crying at commercials or for no reason — you're not broken. You're postpartum.\n\nThe hormonal crash after birth is dramatic. Estrogen and progesterone — at their highest ever during pregnancy — drop to their lowest levels within days of delivery. This directly affects mood and emotional regulation.\n\nCombine this with sleep deprivation and the enormity of new responsibility, and tears are a completely rational response. Give yourself full permission to cry."},
    {"title": "Finding Your Mom Tribe", "category": "Building Support Systems", "read_time_minutes": 3,
     "content": "Social isolation is one of the strongest predictors of postpartum depression. Building a support network is protective mental health infrastructure.\n\nWhere to find your people:\n- Mom groups through your hospital or OB's office\n- Local Facebook groups for parents born in the same month\n- Stroller fitness classes\n- Apps like Peanut, designed for mom friendships\n\nStart small: one coffee, one walk. One person who gets it makes a significant difference."},
    {"title": "Communicating with Your Partner After Baby", "category": "Building Support Systems", "read_time_minutes": 4,
     "content": "Relationship satisfaction drops for most couples in the first year after a baby — this is normal.\n\nThings that help:\n- Weekly 20-minute check-ins: share what's been hard and what you appreciate\n- Explicit division of labor — write it down\n- Asking directly: 'I need X right now'\n- Physical affection that isn't sexual — a 20-second hug\n- Remembering you are teammates, not opponents"},
    {"title": "When to Seek Professional Help", "category": "Building Support Systems", "read_time_minutes": 3,
     "content": "Knowing when to seek professional support is an act of courage.\n\nSeek help soon if you experience:\n- Persistent sadness for more than two weeks\n- Anxiety that interferes with daily function\n- Intrusive thoughts about harming yourself or your baby\n- Feeling disconnected from your baby\n\nWhere to start:\n- Your OB or midwife\n- Postpartum Support International: postpartum.net\n- Crisis line: 988 Suicide & Crisis Lifeline"},
]

def seed():
    db = SessionLocal()
    existing = db.query(Article).count()
    if existing > 0:
        print(f"Already have {existing} articles, skipping seed.")
        db.close()
        return
    for a in ARTICLES:
        db.add(Article(**a))
    db.commit()
    print(f"Seeded {len(ARTICLES)} articles.")
    db.close()

if __name__ == "__main__":
    seed()

require('dotenv').config();
const supabase = require('./config/supabase');

async function migrate() {
  try {
    const { data: technicians, error } = await supabase.from('technicians').select('*');
    if (error) throw error;
    
    let count = 0;
    
    for (const tech of (technicians || [])) {
      let updated = false;
      let newCat = tech.category;
      let newSkills = tech.skills || [];
      
      if (typeof newCat === 'string' && newCat.toLowerCase() === 'house keeping') {
        newCat = 'Cleaning';
        updated = true;
      }
      
      const newSkillsMapped = newSkills.map(s => {
        if (s.toLowerCase() === 'house keeping') {
          updated = true;
          return 'Cleaning';
        }
        return s;
      });
      
      if (updated) {
        await supabase.from('technicians').update({
          category: newCat,
          skills: newSkillsMapped
        }).eq('id', tech.id);
        console.log(`Updated technician ${tech.name} (${tech.id})`);
        count++;
      }
    }
    console.log(`Migrated ${count} technicians.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

migrate();

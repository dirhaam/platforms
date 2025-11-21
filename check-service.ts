
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkService() {
    const serviceId = 'a22fdbed-9797-492b-811b-0bde9f0e138b';
    console.log(`Checking service: ${serviceId}`);

    const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', serviceId);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Service found:', data);
    }
}

checkService();

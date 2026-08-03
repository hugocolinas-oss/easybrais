update public.accommodations
set reservation_notes = 'Consigna: 2 € / mochila. El precio se pagará cuando vaya a recoger su equipaje.'
where external_code in ('8.30', '8.33');

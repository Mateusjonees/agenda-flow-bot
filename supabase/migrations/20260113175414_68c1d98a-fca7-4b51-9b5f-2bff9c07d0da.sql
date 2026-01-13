-- Aprovar os depoimentos pendentes
UPDATE testimonials 
SET is_approved = true 
WHERE id IN ('06b8118c-40a0-40dd-aab7-645ac7d68ad9', '674961a5-0394-4ff0-85cb-4744e937e4d7');
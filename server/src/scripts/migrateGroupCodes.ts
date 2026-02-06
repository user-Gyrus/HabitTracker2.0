import mongoose from 'mongoose';
import Group from '../models/Group';
import { generateGroupCode } from '../utils/generateGroupCode';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Migration Script: Generate groupCode for existing groups
 * 
 * This script updates all groups in the database that don't have a groupCode
 * by generating a unique code for each one.
 * 
 * Usage: npx ts-node src/scripts/migrateGroupCodes.ts
 */

async function migrateGroupCodes() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/habit-tracker';
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        // Find all groups without a groupCode
        const groupsWithoutCode = await Group.find({
            $or: [
                { groupCode: { $exists: false } },
                { groupCode: null },
                { groupCode: '' }
            ]
        });

        console.log(`📊 Found ${groupsWithoutCode.length} groups without groupCode`);

        if (groupsWithoutCode.length === 0) {
            console.log('✨ All groups already have groupCodes!');
            await mongoose.disconnect();
            return;
        }

        // Generate and assign codes
        let updated = 0;
        let failed = 0;

        for (const group of groupsWithoutCode) {
            try {
                let newCode = generateGroupCode();
                
                // Ensure uniqueness (retry if collision)
                let attempts = 0;
                while (await Group.findOne({ groupCode: newCode }) && attempts < 10) {
                    newCode = generateGroupCode();
                    attempts++;
                }

                if (attempts >= 10) {
                    console.error(`❌ Failed to generate unique code for group ${group._id}`);
                    failed++;
                    continue;
                }

                // Update the group
                group.groupCode = newCode;
                await group.save();
                
                console.log(`✅ Updated group "${group.name}" (${group._id}) with code: ${newCode}`);
                updated++;
            } catch (error) {
                console.error(`❌ Error updating group ${group._id}:`, error);
                failed++;
            }
        }

        console.log('\n📈 Migration Summary:');
        console.log(`   ✅ Successfully updated: ${updated} groups`);
        console.log(`   ❌ Failed: ${failed} groups`);
        console.log(`   📊 Total processed: ${groupsWithoutCode.length} groups`);

        // Disconnect
        await mongoose.disconnect();
        console.log('\n✅ Migration complete! Database disconnected.');
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

// Run the migration
migrateGroupCodes();

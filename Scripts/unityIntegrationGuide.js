/**
 * UNITY INTEGRATION GUIDE FOR DRONE TRAINING PROGRESS
 * 
 * This file documents how Unity/VR applications should send progress data
 * to the backend API when a student completes a training module.
 */

// ============================================
// EXAMPLE 1: Recording Progress (No Scorecard)
// ============================================

const recordProgressBasic = async () => {
    const progressData = {
        studentId: 123,              // Student's user ID
        classId: 45,                 // Class ID
        categoryId: 1,               // Drone category (1=FPV, 2=Surveillance, 3=Payload)
        moduleId: 5,                 // Training module ID (e.g., Tutorial)
        submoduleId: 12,             // Sub-module ID (e.g., "City")
        subsubmoduleId: 36,          // Sub-sub-module ID (e.g., "Rain")
        completed: true,             // Whether the module was completed
        score: 85.5,                 // Score achieved (optional)
        completionData: {            // Additional metadata (optional)
            timeSpent: 450,            // seconds
            attempts: 2,
            accuracy: 92.3,
            timestamp: new Date().toISOString()
        }
    };

    try {
        const response = await fetch('http://localhost:5000/drone-training/progress', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(progressData)
        });

        const result = await response.json();
        console.log('Progress recorded:', result);
    } catch (error) {
        console.error('Error recording progress:', error);
    }
};

// ============================================
// EXAMPLE 2: Recording Progress WITH Scorecard Image
// ============================================

const recordProgressWithScorecard = async (scorecardImageBlob) => {
    const formData = new FormData();

    // Add all progress fields
    formData.append('studentId', '123');
    formData.append('classId', '45');
    formData.append('categoryId', '1');
    formData.append('moduleId', '5');
    formData.append('submoduleId', '12');
    formData.append('subsubmoduleId', '36');
    formData.append('completed', 'true');
    formData.append('score', '85.5');
    formData.append('completionData', JSON.stringify({
        timeSpent: 450,
        attempts: 2,
        accuracy: 92.3,
        timestamp: new Date().toISOString()
    }));

    // Add scorecard image
    formData.append('scorecard', scorecardImageBlob, 'scorecard.png');

    try {
        const response = await fetch('http://localhost:5000/drone-training/progress', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
                // Note: Do NOT set Content-Type for FormData, browser will set it automatically
            },
            body: formData
        });

        const result = await response.json();
        console.log('Progress with scorecard recorded:', result);
        console.log('Scorecard path:', result.scorecardImagePath);
    } catch (error) {
        console.error('Error recording progress:', error);
    }
};

// ============================================
// EXAMPLE 3: Unity C# Integration Example
// ============================================

/*
using UnityEngine;
using UnityEngine.Networking;
using System.Collections;
using System.Text;

public class DroneTrainingProgressTracker : MonoBehaviour
{
    private string apiUrl = "http://localhost:5000/drone-training/progress";
    private string authToken = ""; // Get from login

    [System.Serializable]
    public class ProgressData
    {
        public int studentId;
        public int classId;
        public int categoryId;
        public int moduleId;
        public int submoduleId;
        public int subsubmoduleId;
        public bool completed;
        public float score;
        public CompletionData completionData;
    }

    [System.Serializable]
    public class CompletionData
    {
        public int timeSpent;
        public int attempts;
        public float accuracy;
        public string timestamp;
    }

    public IEnumerator RecordProgress(
        int studentId, 
        int classId, 
        int categoryId, 
        int moduleId, 
        int submoduleId, 
        int subsubmoduleId,
        bool completed,
        float score,
        int timeSpent,
        int attempts,
        float accuracy
    )
    {
        ProgressData data = new ProgressData
        {
            studentId = studentId,
            classId = classId,
            categoryId = categoryId,
            moduleId = moduleId,
            submoduleId = submoduleId,
            subsubmoduleId = subsubmoduleId,
            completed = completed,
            score = score,
            completionData = new CompletionData
            {
                timeSpent = timeSpent,
                attempts = attempts,
                accuracy = accuracy,
                timestamp = System.DateTime.UtcNow.ToString("o")
            }
        };

        string jsonData = JsonUtility.ToJson(data);
        byte[] bodyRaw = Encoding.UTF8.GetBytes(jsonData);

        UnityWebRequest request = new UnityWebRequest(apiUrl, "POST");
        request.uploadHandler = new UploadHandlerRaw(bodyRaw);
        request.downloadHandler = new DownloadHandlerBuffer();
        request.SetRequestHeader("Content-Type", "application/json");
        request.SetRequestHeader("Authorization", "Bearer " + authToken);

        yield return request.SendWebRequest();

        if (request.result == UnityWebRequest.Result.Success)
        {
            Debug.Log("Progress recorded successfully: " + request.downloadHandler.text);
        }
        else
        {
            Debug.LogError("Error recording progress: " + request.error);
        }
    }

    public IEnumerator RecordProgressWithScorecard(
        int studentId,
        int classId,
        int categoryId,
        int moduleId,
        int submoduleId,
        int subsubmoduleId,
        bool completed,
        float score,
        Texture2D scorecardTexture
    )
    {
        WWWForm form = new WWWForm();
        
        form.AddField("studentId", studentId);
        form.AddField("classId", classId);
        form.AddField("categoryId", categoryId);
        form.AddField("moduleId", moduleId);
        form.AddField("submoduleId", submoduleId);
        form.AddField("subsubmoduleId", subsubmoduleId);
        form.AddField("completed", completed ? "true" : "false");
        form.AddField("score", score.ToString());

        // Add scorecard image
        byte[] imageBytes = scorecardTexture.EncodeToPNG();
        form.AddBinaryData("scorecard", imageBytes, "scorecard.png", "image/png");

        UnityWebRequest request = UnityWebRequest.Post(apiUrl, form);
        request.SetRequestHeader("Authorization", "Bearer " + authToken);

        yield return request.SendWebRequest();

        if (request.result == UnityWebRequest.Result.Success)
        {
            Debug.Log("Progress with scorecard recorded: " + request.downloadHandler.text);
        }
        else
        {
            Debug.LogError("Error: " + request.error);
        }
    }

    // Example usage when student completes a module
    public void OnModuleCompleted()
    {
        StartCoroutine(RecordProgress(
            studentId: 123,
            classId: 45,
            categoryId: 1,        // FPV Drone
            moduleId: 2,          // Tutorial
            submoduleId: 3,       // "Liftoff"
            subsubmoduleId: 0,    // No sub-sub-module
            completed: true,
            score: 95.5f,
            timeSpent: 300,
            attempts: 1,
            accuracy: 98.2f
        ));
    }
}
*/

// ============================================
// HIERARCHY REFERENCE
// ============================================

/*
DRONE CATEGORIES:
  1. FPV Drone
  2. Surveillance Drone
  3. Payload Drone

MODULES (for each category):
  1. Introduction (no sub-modules)
  2. Tutorial
     - Start
     - Liftoff
     - Move
     - Straight
     - U Maneuver
  3. Intermediate
     - City (Rain, Fog, Wind)
     - Forest (Rain, Fog, Wind)
     - OpenFields (Rain, Fog, Wind)
     - Desert (Rain, Fog, Wind)
  4. Obstacle Course
     - ObstacleCourse
  5. Advanced
     - Level1
     - Level2
  6. Maintenance
     - Parts Identification
     - Assembly
     - Disassembly

PROGRESS TRACKING LEVELS:
  - Module level: Set moduleId, leave submoduleId and subsubmoduleId as null
  - Submodule level: Set moduleId and submoduleId, leave subsubmoduleId as null
  - Sub-submodule level: Set all three IDs
*/

export { recordProgressBasic, recordProgressWithScorecard };

// 

package app.vercel.codora;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;
import com.codetrixstudio.capacitor.GoogleAuth.GoogleAuth;

import java.io.File;
import android.os.Environment;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    // Apparently, I need to register the GoogleAuth plugin
    registerPlugin(GoogleAuth.class);

    // Check for updated files in Directory.Data
    try {
      File dataDir = new File(getFilesDir(), "capacitor_data");
      File indexFile = new File(dataDir, "index.html");

      if (indexFile.exists()) {
        // Log that we're setting a new base path
        android.util.Log.d("MainActivity", "Setting new base path: " + dataDir.getAbsolutePath());
        this.bridge.setServerBasePath(dataDir.getAbsolutePath());
      } else {
        android.util.Log.d("MainActivity", "No update files found in: " + dataDir.getAbsolutePath());
      }
    } catch (Exception e) {
      e.printStackTrace();
      // If anything goes wrong, fall back to default behavior
    }
  }
}
